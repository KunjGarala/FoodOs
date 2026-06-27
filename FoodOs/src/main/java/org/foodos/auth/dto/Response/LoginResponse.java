package org.foodos.auth.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String tokenType;     // always "Bearer"
    private String username;
    private String userId;
    private String role;
}