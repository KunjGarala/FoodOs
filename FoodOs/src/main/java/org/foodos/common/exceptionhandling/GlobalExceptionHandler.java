package org.foodos.common.exceptionhandling;

import jakarta.servlet.http.HttpServletRequest;
import org.foodos.common.exceptionhandling.dto.ApiError;
import org.foodos.common.exceptionhandling.exception.EmailSenderException;
import org.foodos.common.exceptionhandling.exception.FileIsNotImageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(
            BadCredentialsException ex
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError(
                        401,
                        "INVALID_CREDENTIALS",
                        "Invalid username or password"
                ));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> handleLockedException(
            LockedException ex
    ) {
        return ResponseEntity.status(HttpStatus.LOCKED)
                .body(new ApiError(
                        423,
                        "ACCOUNT_LOCKED",
                        "Account locked due to multiple failed login attempts. Try again later."
                ));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabledException(
            DisabledException ex
    ) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError(
                        403,
                        "ACCOUNT_DISABLED",
                        "Your account is disabled"
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(
            Exception ex
    ) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError(
                        500,
                        "INTERNAL_ERROR",
                        "Something went wrong"
                ));
    }

    @ExceptionHandler({IllegalArgumentException.class, NullPointerException.class , EmailSenderException.class , FileIsNotImageException.class , RuntimeException.class})
    public ResponseEntity<ApiError> handleBadReuqests(Exception ex, HttpServletRequest request){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new ApiError(
                        400,
                        "BAD_REQUEST",
                        ex.getMessage()
                )
        );
    }
}
