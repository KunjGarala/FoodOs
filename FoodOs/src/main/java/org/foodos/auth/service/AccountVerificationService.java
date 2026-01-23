package org.foodos.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountVerificationService {

    private final UserAuthRepository repository;

    @Transactional
    public boolean verifyEmail(String code) {

        UserAuthEntity user = repository
                .findByEmailVerificationCode(code)
                .orElse(null);

        if (user == null) {
            log.warn("Invalid verification code");
            return false;
        }

        if (Boolean.TRUE.equals(user.getIsActive())) {
            log.info("User already verified: {}", user.getUsername());
            return true;
        }

        user.setIsActive(true);
        user.setIsLocked(false);
        user.setEmailVerificationCode(null);

        repository.save(user);
        return true;
    }
}
