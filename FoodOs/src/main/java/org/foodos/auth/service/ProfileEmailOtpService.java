package org.foodos.auth.service;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.emails.EmailService;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileEmailOtpService {

    private final UserAuthRepository userAuthRepository;
    private final EmailService emailService;
    private final MeService meService;

    private final Map<Long, PendingOtp> pendingOtps = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Data
    @Builder
    private static class PendingOtp {
        private String newEmail;
        private String otp;
        private LocalDateTime expiresAt;
        private int attempts;
    }

    public void sendEmailChangeOtp(Long userId, String newEmail) {
        if (userId == null) {
            throw new BusinessException("User ID is required");
        }
        if (newEmail == null || newEmail.isBlank()) {
            throw new BusinessException("New email address is required");
        }

        String targetEmail = newEmail.trim().toLowerCase();
        if (!targetEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BusinessException("Invalid email format");
        }

        UserAuthEntity user = userAuthRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (targetEmail.equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException("New email cannot be the same as your current email");
        }

        if (userAuthRepository.existsByEmailAndIsDeletedFalse(targetEmail)) {
            throw new BusinessException("Email is already in use by another account");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", random.nextInt(1000000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        pendingOtps.put(userId, PendingOtp.builder()
                .newEmail(targetEmail)
                .otp(otp)
                .expiresAt(expiresAt)
                .attempts(0)
                .build());

        log.info("Sending profile email change OTP to new email {}", targetEmail);

        String emailSubject = "FoodOS - Email Verification OTP";
        String emailBody = String.format(
                "Hello %s,\n\n" +
                "You requested to update your FoodOS account email to this address.\n\n" +
                "Your verification OTP is: %s\n\n" +
                "This code will expire in 10 minutes.\n" +
                "If you did not request this change, please ignore this email or contact your administrator immediately.\n\n" +
                "— FoodOS Team",
                user.getFullName() != null ? user.getFullName() : user.getUsername(),
                otp
        );

        emailService.sendEmail(targetEmail, emailSubject, emailBody);
    }

    @Transactional
    public void verifyEmailChangeOtp(Long userId, String newEmail, String otp) {
        if (userId == null || newEmail == null || otp == null) {
            throw new BusinessException("User ID, new email, and OTP are required");
        }

        String targetEmail = newEmail.trim().toLowerCase();
        String code = otp.trim();

        PendingOtp pending = pendingOtps.get(userId);
        if (pending == null) {
            throw new BusinessException("No pending verification request found. Please request a new OTP.");
        }

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingOtps.remove(userId);
            throw new BusinessException("Verification code has expired. Please request a new OTP.");
        }

        if (!pending.getNewEmail().equalsIgnoreCase(targetEmail)) {
            throw new BusinessException("Email does not match the pending verification request.");
        }

        if (!pending.getOtp().equals(code)) {
            pending.setAttempts(pending.getAttempts() + 1);
            if (pending.getAttempts() >= 5) {
                pendingOtps.remove(userId);
                throw new BusinessException("Maximum verification attempts exceeded. Please request a new OTP.");
            }
            throw new BusinessException("Invalid verification code. Please check your email and try again.");
        }

        // OTP is valid! Update email in database
        UserAuthEntity user = userAuthRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userAuthRepository.existsByEmailAndIsDeletedFalse(targetEmail) && !targetEmail.equalsIgnoreCase(user.getEmail())) {
            pendingOtps.remove(userId);
            throw new BusinessException("Email was claimed by another account in the meantime");
        }

        user.setEmail(targetEmail);
        userAuthRepository.save(user);
        pendingOtps.remove(userId);

        meService.evictContext(user.getUserUuid());
        log.info("Successfully updated email for user {} to {}", user.getUsername(), targetEmail);
    }
}
