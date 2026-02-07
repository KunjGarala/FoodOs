package org.foodos.auth.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AbstractAuthenticationFailureEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFailureListener {

    private final UserAuthRepository userRepository;

    @EventListener
    @Transactional
    public void onAuthenticationFailure(AbstractAuthenticationFailureEvent event) {

        // getName() is safe and consistent across auth types
        String username = event.getAuthentication().getName();

        if (username == null || username.isBlank()) {
            log.warn("Authentication failure with empty username");
            return;
        }

        userRepository.findByUsername(username)
                .ifPresentOrElse(
                        user -> handleFailure(user, event),
                        () -> log.warn("Authentication failed for non-existing user: {}", username)
                );
    }

    private void handleFailure(UserAuthEntity user, AbstractAuthenticationFailureEvent event) {
        user.onLoginFailure();

        userRepository.save(user);

        log.warn(
                "Authentication failure for user={}, failedAttempts={}, locked={}, reason={}",
                user.getUsername(),
                user.getFailedLoginAttempts(),
                user.getIsLocked(),
                event.getException().getClass().getSimpleName()
        );
    }
}
