package org.foodos.auth.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.DTO.Request.SignupRequest;
import org.foodos.auth.DTO.Response.SignupResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(
            @RequestBody @Valid SignupRequest request
    ) {
        UserAuthEntity user = authService.signup(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SignupResponse(
                        "User registered successfully",
                        user.getUsername()
                ));
    }
}
