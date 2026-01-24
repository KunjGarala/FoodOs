package org.foodos.config;


import org.foodos.auth.utils.JwtUtil;
import org.foodos.auth.authenticationProviders.JWTAuthenticationProvider;
import org.foodos.auth.filters.JWTAuthenticationFilter;
import org.foodos.auth.filters.JWTRefreshFilter;
import org.foodos.auth.filters.JwtValidationFilter;
import org.foodos.auth.repository.UserAuthRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
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
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UserAuthRepository userAuthRepository;

    @Value("${frontend.port.url}")
    private String frontendUrl;

    public SecurityConfig(JwtUtil jwtUtil, @Lazy UserDetailsService userDetailsService , UserAuthRepository userAuthRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userAuthRepository = userAuthRepository;
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
        return new ProviderManager(
                daoAuthenticationProvider(),
                jwtAuthenticationProvider()
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
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
            AuthenticationManager authenticationManager
    ) throws Exception {

        JWTAuthenticationFilter jwtAuthenticationFilter =
                new JWTAuthenticationFilter(authenticationManager, jwtUtil , userAuthRepository);

        JwtValidationFilter jwtValidationFilter =
                new JwtValidationFilter(authenticationManager);

        JWTRefreshFilter jwtRefreshFilter = new JWTRefreshFilter(authenticationManager , jwtUtil);

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/signup", "/auth/google/**" ,
                                "/actuator/**" , "/auth/verify-email/**",
                                "/api/auth/login",
                                "/v3/api-docs/**", "/swagger-ui/**",
                                "/swagger-ui.html",

                                "/api/test/s3/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtValidationFilter, JWTAuthenticationFilter.class)
                .addFilterAfter(jwtRefreshFilter , JwtValidationFilter.class);

        return http.build();
    }
}
