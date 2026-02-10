package org.foodos.order.entity.enums;

/**
 * Types of Kitchen Order Tickets
 */
public enum KotType {
    NEW("New", "New items added to order"),
    RUNNING("Running", "Additional items for existing order"),
    CANCELLATION("Cancellation", "Items cancelled from order"),
    REPRINT("Reprint", "KOT reprinted");

    private final String displayName;
    private final String description;

    KotType(String displayName, String description) {
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

