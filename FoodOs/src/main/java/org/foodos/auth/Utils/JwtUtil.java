package org.foodos.auth.utils;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "sjjagdaygdahhbcysdabafcyus a bcvff7l nfbfvyc bv6c gydryfvgv v";
    private static  final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));


    public String generateToken(String username, String role, String userId, java.util.List<String> restaurantIds, long expiryMinutes) {
        return Jwts.builder()
                .subject(username)
                .claim("username", username)
                .claim("role", role)
                .claim("userId", userId)
                .claim("restaurantIds", restaurantIds)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000))
                .signWith(key)
                .compact();
    }

    public String validateTokenAndGetUsername(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((SecretKey) key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (JwtException e) {
            // Token is invalid
            return null;
        }
    }

    public String getRoleFromToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((SecretKey) key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("role", String.class);
        } catch (JwtException e) {
            return null;
        }
    }

}
