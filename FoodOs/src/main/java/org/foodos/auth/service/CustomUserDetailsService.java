// src/main/java/org/foodos/auth/service/UserAuthEntityService.java
package org.foodos.auth.service;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserAuthRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        UserAuthEntity user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );

        if (!user.isAccountNonLocked()) {
            throw new LockedException("Account locked");
        }

        return user;
    }
}

