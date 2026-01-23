package org.foodos.auth.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.foodos.auth.utils.JwtAuthenticationToken;
import org.foodos.auth.utils.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JWTRefreshFilter extends OncePerRequestFilter {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public JWTRefreshFilter(AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if(!request.getServletPath().equals("/refresh-token")){
            filterChain.doFilter(request , response);
            return;
        }

        String refreshToken = extractJwtFromRequest(request);
        if(refreshToken == null){
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            JwtAuthenticationToken authenticationToken = new JwtAuthenticationToken(refreshToken);
            Authentication authResult = authenticationManager.authenticate(authenticationToken);

            if(authResult.isAuthenticated()) {
                String role = authResult.getAuthorities().iterator().next().getAuthority();
                String token = jwtUtil.generateToken(authResult.getName(), role, 15);
                response.setHeader("Authorization", "Bearer " + token);
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }


    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();

        if(cookies == null){
            return null;
        }

        String refreshToken = null;
        for(Cookie cookie  : cookies){
            if(cookie.getName().equals("refresh_token")){
                refreshToken = cookie.getValue();
            }
        }

        return refreshToken;
    }
}
