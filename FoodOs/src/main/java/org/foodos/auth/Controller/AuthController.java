package org.foodos.auth.Controller;


import lombok.RequiredArgsConstructor;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repositry.UserAuthEntityRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth/")
public class AuthController {

    final UserAuthEntityRepo userAuthEntityRepo;
    final PasswordEncoder passwordEncoder;


    @PostMapping("/sign-up")
    public ResponseEntity<?> signUp(@RequestBody UserAuthEntity userAuthEntity){
        // Implement sign-up logic here
        userAuthEntity.setPassword(passwordEncoder.encode(userAuthEntity.getPassword()));
        userAuthEntityRepo.save(userAuthEntity);
        return ResponseEntity.ok("User registered successfully");
    }



}
