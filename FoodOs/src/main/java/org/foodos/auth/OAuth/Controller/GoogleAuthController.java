package org.foodos.auth.OAuth.Controller;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.OAuth.Service.GoogleAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
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
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

            // Process login via service
            Map<String, String> tokens = googleAuthService.processGoogleLogin(code);

            // Set refresh token as HttpOnly cookie
            generateCookie(request, response, tokens.get("refresh_token"));

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

    public static void generateCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            String refreshToken
    ) {
        boolean secure = isSecureRequest(request);
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static boolean isSecureRequest(HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null
                && "https".equalsIgnoreCase(forwardedProto.split(",", 2)[0].trim())) {
            return true;
        }

        String forwarded = request.getHeader("Forwarded");
        if (forwarded != null && forwarded.toLowerCase().contains("proto=https")) {
            return true;
        }

        String origin = request.getHeader(HttpHeaders.ORIGIN);
        return request.isSecure() || (origin != null && origin.startsWith("https://"));
    }

}