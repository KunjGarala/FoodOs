package org.foodos.order.entity.enums;

/**
 * Overall status of Kitchen Order Ticket
 */
public enum KotTicketStatus {
    PENDING("Pending", "Not yet sent"),
    SENT("Sent", "Sent to kitchen"),
    ACKNOWLEDGED("Acknowledged", "Kitchen acknowledged"),
    IN_PROGRESS("In Progress", "Items being prepared"),
    READY("Ready", "All items ready"),
    COMPLETED("Completed", "All items served"),
    CANCELLED("Cancelled", "KOT cancelled");

    private final String displayName;
    private final String description;

    KotTicketStatus(String displayName, String description) {
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

