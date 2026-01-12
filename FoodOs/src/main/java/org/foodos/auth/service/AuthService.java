package org.foodos.auth.service;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.DTO.Request.SignupRequest;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.repositry.UserAuthRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAuthRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAuthEntity signup(SignupRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        UserAuthEntity user = new UserAuthEntity();

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRestaurantId(request.getRestaurantId());
        user.setEmployeeCode(request.getEmployeeCode());
        user.setPin(request.getPin());

        user.setRole(UserRole.valueOf(request.getRole()));

        // defaults (already set, but explicit is good)
        user.setIsActive(true);
        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);

        return userRepository.save(user);
    }
}