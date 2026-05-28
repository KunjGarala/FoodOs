package org.foodos.auth.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Body returned by POST /api/auth/login.
 * The access token is also sent in the Authorization response header for
 * backward compatibility, but is included here so the frontend can read it
 * directly from JSON without depending on CORS-exposed headers.
 */
@Getter
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String tokenType;     // always "Bearer"
    private String username;
    private String userId;
    private String role;
    private List<String> restaurantIds;
}