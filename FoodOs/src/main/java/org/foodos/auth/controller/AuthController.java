package org.foodos.auth.controller;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.dto.Request.ForgotPasswordRequest;
import org.foodos.auth.dto.Request.ResetPasswordRequest;
import org.foodos.auth.dto.Request.SignupRequest;
import org.foodos.auth.dto.Response.ApiResponse;
import org.foodos.auth.dto.Response.SignupResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Set;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SignupResponse> signup(
            @RequestPart("data") String data,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {

        SignupRequest request;
        try {
            request = objectMapper.readValue(data, SignupRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid JSON format");
        }

        Set<ConstraintViolation<SignupRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (ConstraintViolation<SignupRequest> violation : violations) {
                sb.append(violation.getMessage()).append("; ");
            }
            throw new IllegalArgumentException(sb.toString());
        }

        UserAuthEntity user = authService.signup(request, image);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SignupResponse(
                        "User registered successfully",
                        user.getUsername()
                ));
    }


    @PostMapping("/user-want-create-restaurant")
    @PreAuthorize("hasRole('GUEST')")
    public ResponseEntity<Void> userWantCreateRestaurant(
            HttpServletResponse response,
            HttpServletRequest request,
            @RequestParam boolean wantToCreateRestaurant,
            @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        authService.userWantCreateRestaurant(
                response,
                request,
                wantToCreateRestaurant,
                currentUser
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request-password-reset")
    public ResponseEntity<ApiResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(
                new ApiResponse(true , null ,"If the email exists, a reset link has been sent.")
        );
    }


    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
                new ApiResponse(true , null ,"Password has been reset successfully.")
        );
    }







}
