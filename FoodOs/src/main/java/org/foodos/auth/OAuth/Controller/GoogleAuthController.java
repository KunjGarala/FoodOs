package org.foodos.auth.OAuth.Controller;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.OAuth.Service.GoogleAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/auth/google")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${frontend.port.url}"}, allowCredentials = "true")
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;

    @Value("${frontend.port.url}")
    private String frontendUrl;

    /**
     * Initiates Google OAuth flow - redirect user to Google
     */
    @GetMapping("/login")
    public void initiateGoogleLogin(HttpServletResponse response) throws IOException {
        String googleAuthUrl = googleAuthService.getGoogleLoginUrl();
        response.sendRedirect(googleAuthUrl);
    }


    @GetMapping("/callback")
    public void handleGoogleCallback(
            @RequestParam("code") String code,
            HttpServletResponse response
    ) throws IOException {

            // Process login via service
            Map<String, String> tokens = googleAuthService.processGoogleLogin(code);

            // Set refresh token as HttpOnly cookie
            setRefreshTokenCookie(response, tokens.get("refresh_token"));

            // Build redirect URL with access token
            String redirectUrl = buildSuccessRedirectUrl(tokens.get("access_token"));

            response.sendRedirect(redirectUrl);

    }

    /**
     * Build success redirect URL with access token only (refresh token in cookie)
     */
    private String buildSuccessRedirectUrl(String accessToken) {
        return UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/auth/callback")
                .queryParam("success", "true")
                .queryParam("access_token", accessToken)
                .build()
                .toUriString();
    }

    /**
     * Set refresh token as HttpOnly cookie for security
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        generateCookie(response, refreshToken);
    }

    public static void generateCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days in seconds

        response.addCookie(cookie);
    }

}