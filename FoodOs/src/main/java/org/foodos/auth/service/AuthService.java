package org.foodos.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.OAuth.Controller.GoogleAuthController;
import org.foodos.auth.Utils.RestaurantGetUtil;
import org.foodos.common.emails.EmailService;
import org.foodos.common.Utils.Helper;
import org.foodos.common.Utils.S3Service;
import org.foodos.auth.DTO.Request.SignupRequest;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.repository.UserAuthRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.foodos.auth.Utils.JwtUtil;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Helper helper;
    private final S3Service s3Service;
    private final JwtUtil jwtUtil;
    private final RestaurantGetUtil restaurantGetUtil;

    public UserAuthEntity signup(SignupRequest request, MultipartFile image) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        UserAuthEntity user = new UserAuthEntity();

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEmployeeCode(request.getEmployeeCode());
        user.setPin(request.getPin());
//        user.setRestaurantId(request.getRestaurantId());


        String emailValidationCode = java.util.UUID.randomUUID().toString();
        user.setEmailVerificationCode(emailValidationCode);
        if(request.getRole() == null || request.getRole().isEmpty()) {
            user.setRole(UserRole.OWNER); // default role
        } else {
            user.setRole(UserRole.valueOf(request.getRole()));
        }

        if (image != null && !image.isEmpty()) {
            String profileUrl = s3Service.uploadImage(image, "users/profile");
            user.setProfilePictureUrl(profileUrl);
        }

        // defaults (already set, but explicit is good)
        user.setIsActive(false);
        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);


        String varificationLink = helper.generateEmailVerificationLink(emailValidationCode);
        emailService.sendEmail(user.getEmail(),"Email Verification Link For FoodOs" , varificationLink);
        return userRepository.save(user);
    }

    @Transactional
    public void userWantCreateRestaurant(
            HttpServletResponse response,
            HttpServletRequest request,
            boolean wantToCreateRestaurant,
            UserAuthEntity currentUser
    ) {
        if (currentUser.getRole() != UserRole.GUEST) {
            throw new IllegalStateException("Only GUEST can request");
        }

        if (!wantToCreateRestaurant) {
            return;
        }

        currentUser.setRole(UserRole.OWNER);
        userRepository.save(currentUser);

        UserAuthEntity updatedUser = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));


        String accessToken = jwtUtil.generateToken(
                updatedUser,
                15
        );

        String refreshToken = jwtUtil.generateToken(
                updatedUser,
                7 * 24 * 60
        );

        response.setHeader("Authorization", "Bearer " + accessToken);
        GoogleAuthController.generateCookie(response, refreshToken);
    }

}