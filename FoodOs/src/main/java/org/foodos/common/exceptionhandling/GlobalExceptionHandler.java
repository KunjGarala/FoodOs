package org.foodos.common.exceptionhandling;

import jakarta.servlet.http.HttpServletRequest;
import org.foodos.common.exceptionhandling.dto.ApiError;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.EmailSenderException;
import org.foodos.common.exceptionhandling.exception.FileIsNotImageException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;

import org.springframework.security.access.AccessDeniedException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError(401, "INVALID_CREDENTIALS",
                        "Invalid username or password"));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> handleLockedException() {
        return ResponseEntity.status(HttpStatus.LOCKED)
                .body(new ApiError(423, "ACCOUNT_LOCKED",
                        "Account locked due to multiple failed login attempts"));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabledException() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError(403, "ACCOUNT_DISABLED",
                        "Your account is disabled"));
    }

    @ExceptionHandler({ AccessDeniedException.class, HttpClientErrorException.Forbidden.class })
    public ResponseEntity<ApiError> handleAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError(403, "ACCESS_DENIED",
                        "You do not have permission to access this resource"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(
            ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError(404, "RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusinessException(
            BusinessException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "BUSINESS_RULE_VIOLATION", ex.getMessage()));
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            FileIsNotImageException.class
    })
    public ResponseEntity<ApiError> handleBadRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "BAD_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(EmailSenderException.class)
    public ResponseEntity<ApiError> handleEmailError(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiError(502, "EMAIL_SERVICE_FAILED", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError(500, "INTERNAL_ERROR",
                        "Something went wrong"));
    }
}

