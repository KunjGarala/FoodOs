package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.restaurant.entity.enums.LicenseType;
import org.foodos.restaurant.entity.enums.RestaurantType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Basic restaurant information for listings and references")
public class RestaurantBasicDTO {

    @Schema(description = "Unique restaurant UUID", example = "123e4567-e89b-12d3-a456-426614174000")
    private String restaurantUuid;

    @Schema(description = "Restaurant name", example = "Bistro Central")
    private String name;

    @Schema(description = "Legal business name", example = "Bistro Central LLC")
    private String businessName;

    @Schema(description = "Contact email", example = "contact@bistrocentral.com")
    private String email;

    @Schema(description = "Contact phone number", example = "+1234567890")
    private String phoneNumber;

    @Schema(description = "City location", example = "New York")
    private String city;

    @Schema(description = "State/Province", example = "NY")
    private String state;

    @Schema(description = "License type", example = "PREMIUM")
    private LicenseType licenseType;

    @Schema(description = "Restaurant type", example = "FINE_DINING")
    private RestaurantType restaurantType;

    @Schema(description = "Logo URL", example = "https://example.com/logo.png")
    private String logoUrl;

    @Schema(description = "Whether restaurant is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Whether it's a multi-outlet restaurant", example = "false")
    private Boolean isMultiOutlet;

    @Schema(description = "Parent restaurant UUID (for franchises)", example = "123e4567-e89b-12d3-a456-426614174001")
    private String parentRestaurantUuid;

    @Schema(description = "Owner UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String ownerUuid;

    @Schema(description = "Formatted address")
    public String getFormattedAddress() {
        if (city == null && state == null) {
            return null;
        }
        StringBuilder address = new StringBuilder();
        if (city != null) {
            address.append(city);
        }
        if (state != null) {
            if (address.length() > 0) {
                address.append(", ");
            }
            address.append(state);
        }
        return address.toString();
    }

    @Schema(description = "Display name (business name if available, otherwise restaurant name)")
    public String getDisplayName() {
        return businessName != null && !businessName.trim().isEmpty()
                ? businessName
                : name;
    }

    @Schema(description = "License status")
    public String getLicenseStatus() {
        if (licenseType == null) {
            return "UNKNOWN";
        }
        return licenseType.name();
    }

    @Schema(description = "Whether this is a parent restaurant")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean isParent() {
        return parentRestaurantUuid == null;
    }

    @Schema(description = "Whether this is a child/franchise restaurant")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean isChild() {
        return parentRestaurantUuid != null;
    }
}