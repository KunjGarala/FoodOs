package org.foodos.auth.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.dto.Response.ApiResponse;
import org.foodos.auth.service.AccountVerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AccountVerificationController {

    private final AccountVerificationService verificationService;

    @PostMapping("/api/auth/verify-email")
    public ResponseEntity<ApiResponse> verifyAccount(@RequestParam("code") String code) {

        boolean verified = verificationService.verifyEmail(code);

        if (verified) {
            log.info("Email verification successful for code={}", code);
            return ResponseEntity.ok(new ApiResponse(true, null, "Account verified successfully"));
        }

        log.warn("Email verification failed for code={}", code);
        return ResponseEntity.badRequest().body(new ApiResponse(false, null, "Invalid or expired verification code"));
    }
}
