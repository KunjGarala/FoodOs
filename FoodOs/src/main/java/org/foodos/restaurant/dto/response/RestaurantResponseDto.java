package org.foodos.restaurant.dto.response;

import lombok.*;
import org.foodos.restaurant.entity.enums.LicenseType;
import org.foodos.restaurant.entity.enums.RestaurantType;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantResponseDto {

    /* ================= IDENTIFIERS ================= */

    private String restaurantUuid;

    private String name;

    private String businessName;

    private String ownerName;

    /* ================= CONTACT ================= */

    private String phoneNumber;

    private String email;

    /* ================= ADDRESS ================= */

    private String address;

    private String city;

    private String state;

    private String postalCode;

    /* ================= LEGAL ================= */

    private String gstNumber;

    private String fssaiLicense;

    private String panNumber;

    /* ================= LICENSE ================= */

    private LicenseType licenseType;

    private LocalDateTime licenseExpiry;

    private String licenseKey;

    /* ================= RESTAURANT CONFIG ================= */

    private RestaurantType restaurantType;

    private String logoUrl;

    private Boolean isMultiOutlet;

    private Boolean isActive;

    /* ================= FRANCHISE ================= */

    /**
     * UUID of main restaurant (null if this is main)
     */
    private String parentRestaurantUuid;

    /**
     * UUIDs of child outlets (empty if none)
     */
    private List<String> childRestaurantUuids;

    /* ================= META ================= */

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
