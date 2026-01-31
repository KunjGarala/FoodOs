package org.foodos.auth.filters;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.OAuth.Controller.GoogleAuthController;
import org.foodos.auth.Utils.JwtUtil;
import org.foodos.auth.entity.LoginRequest;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.auth.Utils.RestaurantGetUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserAuthRepository userRepository;
    private final RestaurantGetUtil restaurantGetUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!request.getServletPath().equals("/genrate-token")) {
            filterChain.doFilter(request, response);
            return;
        }

        ObjectMapper objectMapper = new ObjectMapper();
        LoginRequest loginRequest =
                objectMapper.readValue(request.getInputStream(), LoginRequest.class);

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                );

        Authentication authResult =
                authenticationManager.authenticate(authToken);

        UserAuthEntity user = (UserAuthEntity) authResult.getPrincipal();

        user.resetFailedLoginAttempts();
        userRepository.save(user);



        String accessToken =
                jwtUtil.generateToken(user, 15);

        String refreshToken =
                jwtUtil.generateToken(user, 7 * 24 * 60);

        response.setHeader("Authorization", "Bearer " + accessToken);
        GoogleAuthController.generateCookie(response, refreshToken);
        response.setStatus(HttpServletResponse.SC_OK);
    }
}
