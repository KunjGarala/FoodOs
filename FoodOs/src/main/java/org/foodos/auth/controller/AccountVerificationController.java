package org.foodos.auth.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.service.AccountVerificationService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@Slf4j
public class AccountVerificationController {

    private final AccountVerificationService verificationService;

    @GetMapping("/auth/verify-email")
    public String verifyAccount(@RequestParam("code") String code) {

        boolean verified = verificationService.verifyEmail(code);

        if (verified) {
            log.info("Email verification successful for code={}", code);
            return "account_verified";
        }

        log.warn("Email verification failed for code={}", code);
        return "account_verification_failed";
    }
}
