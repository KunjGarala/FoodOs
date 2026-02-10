package org.foodos.order.entity.enums;

/**
 * Order lifecycle status
 * Follows a strict state machine pattern
 */
public enum OrderStatus {
    DRAFT("Draft", "Order is being created", false, false),
    OPEN("Open", "Order confirmed, items can be added", false, false),
    KOT_SENT("KOT Sent", "Kitchen order ticket sent", false, false),
    IN_PROGRESS("In Progress", "Kitchen is preparing items", false, false),
    READY("Ready", "All items prepared, ready to serve", false, false),
    SERVED("Served", "Items served to customer", false, false),
    BILLED("Billed", "Bill generated", false, false),
    PAID("Paid", "Payment received", true, false),
    COMPLETED("Completed", "Order completed successfully", true, false),
    CANCELLED("Cancelled", "Order cancelled", true, true),
    VOID("Void", "Order voided", true, true);

    private final String displayName;
    private final String description;
    private final boolean terminal; // Cannot transition from this state
    private final boolean cancelled; // Represents cancellation

    OrderStatus(String displayName, String description, boolean terminal, boolean cancelled) {
        this.displayName = displayName;
        this.description = description;
        this.terminal = terminal;
        this.cancelled = cancelled;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isTerminal() {
        return terminal;
    }

    public boolean isCancelled() {
        return cancelled;
    }

    public boolean canTransitionTo(OrderStatus newStatus) {
        if (this.terminal) {
            return false;
        }

        // Define valid transitions
        return switch (this) {
            case DRAFT -> newStatus == OPEN || newStatus == CANCELLED;
            case OPEN -> newStatus == KOT_SENT || newStatus == BILLED || newStatus == CANCELLED;
            case KOT_SENT -> newStatus == IN_PROGRESS || newStatus == CANCELLED;
            case IN_PROGRESS -> newStatus == READY || newStatus == CANCELLED;
            case READY -> newStatus == SERVED || newStatus == CANCELLED;
            case SERVED -> newStatus == BILLED || newStatus == CANCELLED;
            case BILLED -> newStatus == PAID || newStatus == CANCELLED;
            case PAID -> newStatus == COMPLETED;
            default -> false;
        };
    }
}

