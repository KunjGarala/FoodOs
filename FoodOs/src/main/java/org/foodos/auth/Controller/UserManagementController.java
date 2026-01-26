package org.foodos.auth.controller;

import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.DTO.Request.SignupRequest;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.service.UserManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserManagementController {

    private final UserManagementService userManagementService;

    @PostMapping("/create-employee")
    public ResponseEntity<?> createEmployee(
            @RequestBody @Valid SignupRequest request,
            @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        UserAuthEntity createdUser = userManagementService.createEmployee(request, currentUser);

        return ResponseEntity.ok(Map.of(
                "message", "Employee created successfully",
                "userId", createdUser.getId(),
                "username", createdUser.getUsername()
        ));
    }
}
