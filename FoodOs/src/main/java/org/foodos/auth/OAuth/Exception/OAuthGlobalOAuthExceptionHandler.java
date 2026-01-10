package org.foodos.auth.OAuth.Exception;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@ControllerAdvice
public class OAuthGlobalOAuthExceptionHandler {

    @Value("${frontend.port.url}")
    private String frontendUrl;

    @ExceptionHandler(OAuthAuthenticationException.class)
    public void handleOAuthAuthenticationException(OAuthAuthenticationException ex , HttpServletResponse response) throws IOException {
        String encodedError = URLEncoder.encode(ex.getMessage() != null ? ex.getMessage() : "Unknown error", StandardCharsets.UTF_8);
        String redirectUrl = UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/login")
                .queryParam("error", encodedError)
                .build()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
