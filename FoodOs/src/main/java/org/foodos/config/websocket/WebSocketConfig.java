package org.foodos.config.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration using STOMP over SockJS.
 *
 * Clients connect at:   /ws
 * Send messages to:     /app/**
 * Subscribe to:         /topic/**
 *
 * Topics used:
 *   /topic/tables/{restaurantUuid}       – table status changes
 *   /topic/orders/{restaurantUuid}       – order updates
 *   /topic/kitchen/{restaurantUuid}      – kitchen / KOT updates
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${frontend.port.url}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker for /topic destinations
        registry.enableSimpleBroker("/topic");
        // Client messages prefixed with /app are routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Build secure allowed origin patterns for STOMP over SockJS
        java.util.List<String> allowedPatterns = new java.util.ArrayList<>();
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            for (String part : frontendUrl.split(",")) {
                String trimmed = part.trim().replaceAll("/+$", "");
                if (!trimmed.isEmpty()) {
                    allowedPatterns.add(trimmed);
                }
            }
        }
        allowedPatterns.add("http://localhost:*");
        allowedPatterns.add("http://127.0.0.1:*");
        allowedPatterns.add("https://*.onrender.com");
        allowedPatterns.add("https://*.vercel.app");

        // SockJS fallback endpoint – the frontend connects here
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedPatterns.toArray(new String[0]))
                .withSockJS();
    }
}
