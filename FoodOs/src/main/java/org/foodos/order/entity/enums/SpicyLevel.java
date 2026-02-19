package org.foodos.order.entity.enums;

/**
 * Spicy Level Enum
 * Represents the spiciness level of food items
 */
public enum SpicyLevel {
    NONE("None"),
    MILD("Mild"),
    MEDIUM("Medium"),
    HOT("Hot"),
    EXTRA_HOT("Extra Hot");

    private final String displayName;

    SpicyLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

