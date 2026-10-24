package org.foodos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String id;
    private String type; // "WAITER_ASSIGNED", "KOT_FIRED", "KOT_READY", "INFO"
    private String title;
    private String message;
    private String restaurantUuid;
    private String recipientRole; // "WAITER", "CHEF", "ALL"
    private String recipientUserUuid; // optional targeted waiter UUID
    private String tableNumber;
    private String tableUuid;
    private String orderUuid;
    private String kotNumber;
    private LocalDateTime timestamp;
}
