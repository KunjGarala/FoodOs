package org.foodos.auth.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationSuccessListener {

    private final UserAuthRepository userRepository;

    @EventListener
    @Transactional
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {

        Object principal = event.getAuthentication().getPrincipal();

        // Safety: works even with custom authentication providers
        if (!(principal instanceof UserAuthEntity user)) {
            log.warn("AuthenticationSuccessEvent principal is not User: {}",
                    principal.getClass().getName());
            return;
        }

        // Reset security state
        user.onLoginSuccess();

        userRepository.save(user);

        log.info(
                "Authentication success for user={}, role={}",
                user.getUsername(),
                user.getRole()
//                user.getRestaurant().getId()
        );
    }
}
