package org.foodos.config.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Central service for broadcasting real-time events over WebSocket.
 *
 * All other services (OrderServiceImpl, RestaurantTableService, etc.)
 * inject this bean and call the appropriate method whenever a change
 * happens that should be pushed live to connected clients.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;

    // ─────────────────────────── Table Events ───────────────────────────

    /**
     * Broadcast when a table's status, order assignment, or config changes.
     *
     * @param restaurantUuid restaurant scope
     * @param payload        the updated table DTO (or any serialisable object)
     */
    public void broadcastTableUpdate(String restaurantUuid, Object payload) {
        String dest = "/topic/tables/" + restaurantUuid;
        log.debug("WS → {} : {}", dest, payload);
        messagingTemplate.convertAndSend(dest, payload);
    }

    // ─────────────────────────── Order Events ───────────────────────────

    /**
     * Broadcast whenever an order is created, updated, items added/removed,
     * status changed, bill generated, or payment added.
     */
    public void broadcastOrderUpdate(String restaurantUuid, Object payload) {
        String dest = "/topic/orders/" + restaurantUuid;
        log.debug("WS → {} : {}", dest, payload);
        messagingTemplate.convertAndSend(dest, payload);
    }

    // ─────────────────────────── Kitchen / KOT Events ───────────────────

    /**
     * Broadcast when a new KOT is sent, or a KOT status changes
     * (PENDING → READY → COMPLETED, etc.).
     */
    public void broadcastKitchenUpdate(String restaurantUuid, Object payload) {
        String dest = "/topic/kitchen/" + restaurantUuid;
        log.debug("WS → {} : {}", dest, payload);
        messagingTemplate.convertAndSend(dest, payload);
    }
}
