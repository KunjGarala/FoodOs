package org.foodos.common.exceptionhandling.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    private final int status;
    private final String error;
    private final String message;
    private final String timestamp;
    private final String path;

    // Existing 3-arg constructor (keeps backward compatibility)
    public ApiError(int status, String error, String message) {
        this(status, error, message, null);
    }

    // New 4-arg constructor with path
    public ApiError(int status, String error, String message, String path) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = Instant.now().toString();
        this.path = path;
    }
}
