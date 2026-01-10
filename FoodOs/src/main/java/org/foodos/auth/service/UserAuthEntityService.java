// src/main/java/org/foodos/auth/service/UserAuthEntityService.java
package org.foodos.auth.service;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.repositry.UserAuthEntityRepo;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class UserAuthEntityService implements UserDetailsService {

    private final UserAuthEntityRepo userAuthEntityRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        return userAuthEntityRepo.findByUsernameOrEmail(username , username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

    }
}
