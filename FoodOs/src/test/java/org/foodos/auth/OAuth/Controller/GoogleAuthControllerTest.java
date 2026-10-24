package org.foodos.auth.OAuth.Controller;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GoogleAuthControllerTest {

    @Test
    void refreshCookieSupportsCrossSiteHttpsRequestsBehindAProxy() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-Proto", "https");
        MockHttpServletResponse response = new MockHttpServletResponse();

        GoogleAuthController.generateCookie(request, response, "refresh-token");

        String cookie = response.getHeader("Set-Cookie");
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("SameSite=None"));
    }

    @Test
    void refreshCookieKeepsLocalHttpDevelopmentCompatible() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        GoogleAuthController.generateCookie(request, response, "refresh-token");

        String cookie = response.getHeader("Set-Cookie");
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("SameSite=Lax"));
        assertFalse(cookie.contains("; Secure"));
    }
}
