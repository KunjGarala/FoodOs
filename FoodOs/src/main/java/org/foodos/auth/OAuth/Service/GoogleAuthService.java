package org.foodos.auth.OAuth.Service;

import lombok.RequiredArgsConstructor;
import org.foodos.auth.OAuth.Exception.OAuthAuthenticationException;
import org.foodos.auth.utils_temp.JwtUtil;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.auth.utils_temp.restaurantGetUtil_temp;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserAuthRepository userAuthRepository;
    private final RestTemplate restTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final restaurantGetUtil_temp restaurantGetUtilTemp;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    public String getGoogleLoginUrl() {
        return org.springframework.web.util.UriComponentsBuilder
            .fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
            .queryParam("client_id", clientId)
            .queryParam("redirect_uri", redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", "email profile")
            .queryParam("access_type", "offline")
            .queryParam("prompt", "consent")
            .build()
            .toUriString();
    }

    public Map<String, String> processGoogleLogin(String code) {

        if(code == null || code.isEmpty()) {
            throw new OAuthAuthenticationException("Invalid authorization code");
        }

        Map<String, String> tokens = exchangeCodeForTokens(code);
        String accessToken = tokens.get("access_token");

        Map<String, Object> userInfo = getUserInfo(accessToken);


        String email = validateEmail(userInfo);

        UserAuthEntity user = findOrCreateUser(email ,  userInfo);





        String jwtAccessToken = jwtUtil.generateToken(user,  15); // 15 min
        String jwtRefreshToken = jwtUtil.generateToken(user, 10080); // 7 days

        Map<String, String> result = new HashMap<>();
        result.put("access_token", jwtAccessToken);
        result.put("refresh_token", jwtRefreshToken);
        
        return result;
    }

    private Map<String, String> exchangeCodeForTokens(String code) {
        String tokenEndpoint = "https://oauth2.googleapis.com/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(
                    tokenEndpoint, request, Map.class
            );

            Map<String, Object> body = tokenResponse.getBody();
            if (body == null || !body.containsKey("access_token")) {
                throw new RuntimeException("Failed to obtain access token from Google");
            }

            Map<String, String> tokens = new HashMap<>();
            tokens.put("access_token", (String) body.get("access_token"));
            tokens.put("refresh_token", (String) body.get("refresh_token"));

            return tokens;

        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange code for tokens: " + e.getMessage());
        }
    }

    private Map<String, Object> getUserInfo(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<?> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> userInfoResponse = restTemplate.exchange(
                    userInfoUrl, HttpMethod.GET, request, Map.class
            );

            if (userInfoResponse.getStatusCode() != HttpStatus.OK ||
                    userInfoResponse.getBody() == null) {
                throw new RuntimeException("Failed to retrieve user info from Google");
            }

            return userInfoResponse.getBody();

        } catch (Exception e) {
            throw new RuntimeException("Failed to get user info: " + e.getMessage());
        }
    }

    private String validateEmail(Map<String, Object> userInfo) {
        String email = (String) userInfo.get("email");

        if (email == null || email.isEmpty()) {
            throw new RuntimeException("Email not provided by Google");
        }

        boolean emailVerified = true;

        if (userInfo.containsKey("verified_email")) {
            emailVerified = parseBoolean(userInfo.get("verified_email"));
        } else if (userInfo.containsKey("email_verified")) {
            emailVerified = parseBoolean(userInfo.get("email_verified"));
        }

        if (!emailVerified) {
            throw new RuntimeException("Email not verified by Google");
        }

        return email;
    }

    private UserAuthEntity findOrCreateUser(String email , Map<String, Object> userInfo) {
        return userAuthRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserAuthEntity newUser = new UserAuthEntity();
                    newUser.setEmail(email);
                    newUser.setUsername(generateUniqueUsername(email));
                    newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    newUser.setFullName(userInfo.getOrDefault("name", newUser.getUsername()).toString());
                    newUser.setProfilePictureUrl(userInfo.getOrDefault("picture", "").toString());
                    newUser.setRole(org.foodos.auth.entity.UserRole.GUEST);
                    return userAuthRepository.save(newUser);
                });
    }

    private boolean parseBoolean(Object obj) {
        if (obj instanceof Boolean) {
            return (Boolean) obj;
        } else if (obj instanceof String) {
            return Boolean.parseBoolean((String) obj);
        }
        return false;
    }

    public String generateUniqueUsername(String email) {
        String base = email.split("@")[0]
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase();

        String username = base;
        int count = 1;

        while (userAuthRepository.existsByUsername(username)) {
            username = base + count;
            count++;
        }

        return username;
    }

}
