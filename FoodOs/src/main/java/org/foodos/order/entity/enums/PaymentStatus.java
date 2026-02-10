package org.foodos.order.entity.enums;

/**
 * Payment transaction status
 */
public enum PaymentStatus {
    PENDING("Pending", "Payment initiated"),
    PROCESSING("Processing", "Payment being processed"),
    COMPLETED("Completed", "Payment successful"),
    FAILED("Failed", "Payment failed"),
    REFUNDED("Refunded", "Payment refunded"),
    PARTIALLY_REFUNDED("Partially Refunded", "Partial refund processed");

    private final String displayName;
    private final String description;

    PaymentStatus(String displayName, String description) {
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

