package org.foodos.auth.Listener;


import lombok.RequiredArgsConstructor;
import org.foodos.auth.repositry.UserAuthRepository;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AbstractAuthenticationFailureEvent;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationFailureListener {

    private final UserAuthRepository userRepository;

    @EventListener
    public void onFailure(AbstractAuthenticationFailureEvent event) {

        String username = (String) event.getAuthentication().getPrincipal();

        userRepository.findByUsername(username).ifPresent(user -> {
            user.incrementFailedLoginAttempts();
            userRepository.save(user);
        });
    }
}
