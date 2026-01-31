package org.foodos.auth.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.utils_temp.JwtAuthenticationToken;
import org.foodos.auth.utils_temp.JwtUtil;
import org.foodos.auth.utils_temp.restaurantGetUtil_temp;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JWTRefreshFilter extends OncePerRequestFilter {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final restaurantGetUtil_temp restaurantGetUtilTemp;

    public JWTRefreshFilter(AuthenticationManager authenticationManager, JwtUtil jwtUtil , restaurantGetUtil_temp restaurantGetUtilTemp) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.restaurantGetUtilTemp = restaurantGetUtilTemp;
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
                UserAuthEntity user = (UserAuthEntity) authResult.getPrincipal(); // Cast to UserAuthEntity


                String token = jwtUtil.generateToken(user, 15);
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
