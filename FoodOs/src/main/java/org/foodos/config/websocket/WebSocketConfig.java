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
        // SockJS fallback endpoint – the frontend connects here
        registry.addEndpoint("/ws")
                .setAllowedOrigins(frontendUrl, "http://localhost:5173")
                .withSockJS();
    }
}
