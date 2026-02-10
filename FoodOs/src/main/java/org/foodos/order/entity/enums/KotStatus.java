package org.foodos.order.entity.enums;

/**
 * Kitchen Order Ticket item status
 */
public enum KotStatus {
    PENDING("Pending", "Waiting to be sent to kitchen"),
    FIRED("Fired", "Sent to kitchen"),
    ACKNOWLEDGED("Acknowledged", "Kitchen acknowledged receipt"),
    COOKING("Cooking", "Item is being prepared"),
    READY("Ready", "Item ready for serving"),
    SERVED("Served", "Item served to customer"),
    CANCELLED("Cancelled", "Item cancelled");

    private final String displayName;
    private final String description;

    KotStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}

