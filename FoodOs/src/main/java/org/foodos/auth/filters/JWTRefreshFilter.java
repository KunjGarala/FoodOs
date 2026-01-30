package org.foodos.auth.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.utils.JwtAuthenticationToken;
import org.foodos.auth.utils.JwtUtil;
import org.foodos.auth.utils.RestaurantGetUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JWTRefreshFilter extends OncePerRequestFilter {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RestaurantGetUtil restaurantGetUtil;

    public JWTRefreshFilter(AuthenticationManager authenticationManager, JwtUtil jwtUtil , RestaurantGetUtil restaurantGetUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.restaurantGetUtil = restaurantGetUtil;
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

                String role = user.getRole().name();

                List<String> restaurantUuids = restaurantGetUtil.getRestaurantUuids(user);

                String token = jwtUtil.generateToken(user.getUsername(), role, user.getUserUuid(), restaurantUuids, 15);
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
