package org.foodos.config;

import org.foodos.auth.utils.JwtUtil;
import org.foodos.auth.authenticationProviders.JWTAuthenticationProvider;
import org.foodos.auth.filters.JWTRefreshFilter;
import org.foodos.auth.filters.JwtValidationFilter;
import org.foodos.auth.utils.RestaurantGetUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DefaultAuthenticationEventPublisher;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final RestaurantGetUtil restaurantGetUtil;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Value("${frontend.port.url}")
    private String frontendUrl;

    public SecurityConfig(JwtUtil jwtUtil,
                          @Lazy UserDetailsService userDetailsService,
                          RestaurantGetUtil restaurantGetUtil,
                          ApplicationEventPublisher applicationEventPublisher) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.restaurantGetUtil = restaurantGetUtil;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Bean
    public JWTAuthenticationProvider jwtAuthenticationProvider() {
        return new JWTAuthenticationProvider(jwtUtil, userDetailsService);
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        ProviderManager providerManager = new ProviderManager(
                daoAuthenticationProvider(),
                jwtAuthenticationProvider());

        // Publish authentication success/failure events so the
        // AuthenticationSuccessListener / AuthenticationFailureListener fire.
        // This is what makes account lockout (5 failed attempts -> 30 min lock)
        // and lastLoginAt tracking actually work for the controller-based login.
        providerManager.setAuthenticationEventPublisher(
                new DefaultAuthenticationEventPublisher(applicationEventPublisher));

        return providerManager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        java.util.Set<String> origins = new java.util.LinkedHashSet<>();

        // Add configured frontendUrl (supports comma-separated list and trims trailing slashes)
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            for (String part : frontendUrl.split(",")) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    origins.add(trimmed.replaceAll("/+$", ""));
                }
            }
        }

        // Standard local development origins
        origins.add("http://localhost:5173");
        origins.add("http://localhost:5174");
        origins.add("http://localhost:3000");
        origins.add("http://localhost:8080");
        origins.add("http://localhost:8081");
        origins.add("http://127.0.0.1:5173");
        origins.add("http://127.0.0.1:3000");

        configuration.setAllowedOrigins(new java.util.ArrayList<>(origins));
        configuration.setAllowedOriginPatterns(List.of(
                "https://*.onrender.com",
                "https://*.vercel.app",
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("Authorization", "Refresh-Token"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticationManager authenticationManager) throws Exception {

        JwtValidationFilter jwtValidationFilter = new JwtValidationFilter(authenticationManager);

        JWTRefreshFilter jwtRefreshFilter = new JWTRefreshFilter(authenticationManager, jwtUtil, restaurantGetUtil);

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(contentType -> {})
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/signup", "/auth/google/**",
                                "/actuator/health", "/actuator/health/**", "/actuator/info",
                                "/api/auth/verify-email",
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/refresh-token",
                                "/v3/api-docs/**", "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api/auth/request-password-reset/**",
                                "/api/auth/reset-password/**",
                                "/ws/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtValidationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtRefreshFilter, JwtValidationFilter.class);

        return http.build();
    }
}