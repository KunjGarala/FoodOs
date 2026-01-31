package org.foodos.auth.authenticationProviders;

import org.foodos.auth.Utils.JwtAuthenticationToken;
import org.springframework.security.authentication.AuthenticationProvider;
import org.foodos.auth.Utils.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;


public class JWTAuthenticationProvider implements AuthenticationProvider {
    private JwtUtil jwtUtil;
    private UserDetailsService userDetailsService;

    public JWTAuthenticationProvider(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String token = ((JwtAuthenticationToken) authentication).getToken();

        String username = jwtUtil.validateTokenAndGetUsername(token);
        if(username == null){
            throw  new BadCredentialsException("Invalid JWT token");
        }


        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return new UsernamePasswordAuthenticationToken(userDetails , null , userDetails.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return JwtAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
