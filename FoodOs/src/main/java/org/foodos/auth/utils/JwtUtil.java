package org.foodos.auth.utils;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.foodos.auth.entity.UserAuthEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    /**
     * Signing key, derived from the {@code jwt.secret} property.
     * The raw secret is NEVER hard-coded here — it comes from configuration
     * (environment variable JWT_SECRET in production, dev fallback otherwise).
     */
    private final SecretKey key;

    private final long accessTokenMinutes;
    private final long refreshTokenMinutes;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token.expiration-minutes:15}") long accessTokenMinutes,
            @Value("${jwt.refresh-token.expiration-minutes:10080}") long refreshTokenMinutes
    ) {
        if (!StringUtils.hasText(secret) || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "jwt.secret must be configured and at least 32 characters (256 bits) long. " +
                    "Set the JWT_SECRET environment variable.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenMinutes = refreshTokenMinutes;
    }

    /**
     * Generate a signed JWT for the given user with an explicit expiry (in minutes).
     * Kept for backward compatibility with existing callers.
     */
    public String generateToken(UserAuthEntity user, long expiryMinutes) {
        String username = user.getUsername();
        String userId = user.getUserUuid();
        String role = user.getRole().name();
        // The token deliberately carries only identity + coarse role. The outlet
        // list is NOT a claim anymore — it is served fresh (and cached) from
        // GET /api/me/context, so the token stays small and the picker never goes
        // stale relative to user_restaurants. Authorization is still enforced
        // per-request via UserAuthEntity.canAccessRestaurant(...).
        return Jwts.builder()
                .subject(username)
                .claim("username", username)
                .claim("role", role)
                .claim("userId", userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMinutes * 60 * 1000))
                .signWith(key)
                .compact();
    }

    /** Convenience: short-lived access token using the configured expiry. */
    public String generateAccessToken(UserAuthEntity user) {
        return generateToken(user, accessTokenMinutes);
    }

    /** Convenience: long-lived refresh token using the configured expiry. */
    public String generateRefreshToken(UserAuthEntity user) {
        return generateToken(user, refreshTokenMinutes);
    }

    public long getAccessTokenMinutes() {
        return accessTokenMinutes;
    }

    public long getRefreshTokenMinutes() {
        return refreshTokenMinutes;
    }

    public String validateTokenAndGetUsername(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
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
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("role", String.class);
        } catch (JwtException e) {
            return null;
        }
    }
}