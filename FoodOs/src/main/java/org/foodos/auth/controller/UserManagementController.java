package org.foodos.auth.controller;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.dto.Request.EmployeeUpdateRequest;
import org.foodos.auth.dto.Request.ProfileUpdateDTO;
import org.foodos.auth.dto.Request.SignupRequest;
import org.foodos.auth.dto.Response.ProfileResponseDTO;
import org.foodos.auth.dto.Response.RoleResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.service.ProfileEmailOtpService;
import org.foodos.auth.service.UserManagementService;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserManagementController {

    private final UserManagementService userManagementService;
    private final ProfileEmailOtpService profileEmailOtpService;

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> getProfile(
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        if (currentUser == null) {
            throw new BusinessException("Authentication required");
        }
        return ResponseEntity.ok(userManagementService.getProfile(currentUser));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> updateProfileJson(
            @RequestBody @Valid ProfileUpdateDTO request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        if (currentUser == null) {
            throw new BusinessException("Authentication required");
        }
        return ResponseEntity.ok(userManagementService.updateProfileDirect(currentUser, request));
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponseDTO> updateProfilePut(
            @RequestBody @Valid ProfileUpdateDTO request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        if (currentUser == null) {
            throw new BusinessException("Authentication required");
        }
        return ResponseEntity.ok(userManagementService.updateProfileDirect(currentUser, request));
    }

    @PostMapping("/profile/email-otp/send")
    public ResponseEntity<?> sendEmailChangeOtp(
            @RequestBody Map<String, String> body,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        if (currentUser == null) {
            throw new BusinessException("Authentication required");
        }
        String newEmail = body.get("newEmail");
        if (newEmail == null || newEmail.isBlank()) {
            throw new BusinessException("newEmail is required");
        }
        profileEmailOtpService.sendEmailChangeOtp(currentUser.getId(), newEmail);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Verification code sent to " + newEmail.trim()
        ));
    }

    @PostMapping("/profile/email-otp/verify")
    public ResponseEntity<?> verifyEmailChangeOtp(
            @RequestBody Map<String, String> body,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        if (currentUser == null) {
            throw new BusinessException("Authentication required");
        }
        String newEmail = body.get("newEmail");
        String otp = body.get("otp");
        if (newEmail == null || otp == null) {
            throw new BusinessException("Both newEmail and otp are required");
        }
        profileEmailOtpService.verifyEmailChangeOtp(currentUser.getId(), newEmail, otp);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Email updated successfully to " + newEmail.trim(),
                "email", newEmail.trim()
        ));
    }

    @PostMapping(value = "/create-employee", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createEmployee(
            @RequestPart("data") @Valid SignupRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        UserAuthEntity createdUser = userManagementService.createEmployee(request, currentUser, image);

        return ResponseEntity.ok(Map.of(
                "message", "Employee created successfully",
                "userId", createdUser.getId(),
                "username", createdUser.getUsername()
        ));
    }

    @PatchMapping(value = "/update-profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfile(
            @RequestPart("data") ProfileUpdateDTO request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        UserAuthEntity updatedUser = userManagementService.updateProfile(currentUser, request, image);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @GetMapping("/roles")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        List<RoleResponse> roles = Arrays.stream(UserRole.values())
                .map(role -> RoleResponse.builder()
                        .name(role.name())
                        .level(role.getLevel())
                        .displayName(role.getDisplayName())
                        .permissions(Arrays.asList(role.getPermissions()))
                        .build())
                .toList();
        return ResponseEntity.ok(roles);
    }

    @PatchMapping(value = "/employee/{userId}")
    public ResponseEntity<?> updateEmployee(
            @PathVariable String userId,
            @RequestBody @Valid EmployeeUpdateRequest request,
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        UserAuthEntity updatedUser = userManagementService.updateEmployee(userId, request, currentUser);
        return ResponseEntity.ok(Map.of(
                "message", "Employee details updated successfully",
                "userId", updatedUser.getId(),
                "userUuid", updatedUser.getUserUuid(),
                "username", updatedUser.getUsername()
        ));
    }
}
