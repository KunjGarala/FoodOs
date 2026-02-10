package org.foodos.product.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DietaryType {
    VEG, NON_VEG, VEGAN, EGG, HALAL, JAIN;

    @JsonCreator
    public static DietaryType fromValue(String value){
        if(value == null){
            return null;
        }

        return switch (value.trim().toUpperCase()) {
            case "VEGETARIAN", "VEG" -> VEG;
            case "NON_VEGETARIAN", "NON_VEG" -> NON_VEG;
            case "VEGAN" -> VEGAN;
            case "EGG" -> EGG;
            case "HALAL" -> HALAL;
            case "JAIN" -> JAIN;
            default -> throw new IllegalArgumentException(
                    "Invalid dietaryType: " + value +
                            ". Allowed values: VEG, NON_VEG, VEGAN, EGG, HALAL, JAIN"
            );
        };
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
