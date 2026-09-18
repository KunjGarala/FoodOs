package org.foodos.common.exceptionhandling;

import jakarta.servlet.http.HttpServletRequest;
import org.foodos.common.exceptionhandling.dto.ApiError;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.EmailSenderException;
import org.foodos.common.exceptionhandling.exception.FileIsNotImageException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import org.springframework.security.access.AccessDeniedException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError(401, "INVALID_CREDENTIALS",
                        "The email or password you entered is incorrect. Please check your credentials and try again.",
                        request.getRequestURI()));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> handleLockedException(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.LOCKED)
                .body(new ApiError(423, "ACCOUNT_LOCKED",
                        "Your account has been temporarily locked due to multiple failed login attempts. Please try again after some time or contact support.",
                        request.getRequestURI()));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabledException(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError(403, "ACCOUNT_DISABLED",
                        "Your account is currently disabled. Please contact the administrator to reactivate your account.",
                        request.getRequestURI()));
    }

    @ExceptionHandler({ AccessDeniedException.class, HttpClientErrorException.Forbidden.class })
    public ResponseEntity<ApiError> handleAccessDenied(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError(403, "ACCESS_DENIED",
                        "You do not have the required permissions to perform this action. Please contact your restaurant owner or manager.",
                        request.getRequestURI()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError(404, "RESOURCE_NOT_FOUND", ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusinessException(
            BusinessException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "BUSINESS_RULE_VIOLATION", ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError(409, "CONFLICT", ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            FileIsNotImageException.class
    })
    public ResponseEntity<ApiError> handleBadRequest(Exception ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "BAD_REQUEST", ex.getMessage(),
                        request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "VALIDATION_FAILED",
                        "Please fix the following errors: " + details,
                        request.getRequestURI()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedJson(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "MALFORMED_REQUEST",
                        "The request body could not be read. Please ensure you are sending valid JSON data.",
                        request.getRequestURI()));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "MISSING_PARAMETER",
                        "Required parameter '" + ex.getParameterName() + "' is missing from the request.",
                        request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, "INVALID_PARAMETER",
                        "Parameter '" + ex.getName() + "' has an invalid value. Expected type: " +
                                (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown") + ".",
                        request.getRequestURI()));
    }

    @ExceptionHandler(EmailSenderException.class)
    public ResponseEntity<ApiError> handleEmailError(Exception ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiError(502, "EMAIL_SERVICE_FAILED",
                        "We were unable to send the email at this time. Please try again later.",
                        request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
        // Log the full stack trace for debugging but don't expose internals to the client
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError(500, "INTERNAL_ERROR",
                        "An unexpected error occurred while processing your request. Please try again later or contact support if the problem persists.",
                        request.getRequestURI()));
    }
}
