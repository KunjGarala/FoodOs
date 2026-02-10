package org.foodos.order.entity.enums;

/**
 * Types of orders supported by the system
 */
public enum OrderType {
    DINE_IN("Dine In", "Customer dining at restaurant"),
    TAKEAWAY("Takeaway", "Customer picks up order"),
    DELIVERY("Delivery", "Order delivered to customer"),
    ONLINE("Online", "Order placed through online platform");

    private final String displayName;
    private final String description;

    OrderType(String displayName, String description) {
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

