package org.foodos.auth.Listener;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repositry.UserAuthRepository;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationSuccessListener {

    private final UserAuthRepository userRepository;

    @EventListener
    public void onSuccess(AuthenticationSuccessEvent event) {

        UserAuthEntity user =
                (UserAuthEntity) event.getAuthentication().getPrincipal();

        user.resetFailedLoginAttempts();
        userRepository.save(user);
    }
}
