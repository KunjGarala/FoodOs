package org.foodos.auth.controller_temp;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.dto_temp.Request.ProfileUpdateDTO;
import org.foodos.auth.dto_temp.Request.SignupRequest;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.service.UserManagementService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserManagementController {

    private final UserManagementService userManagementService;

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
}
