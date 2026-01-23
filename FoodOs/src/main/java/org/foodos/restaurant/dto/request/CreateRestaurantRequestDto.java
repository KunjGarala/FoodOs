package org.foodos.restaurant.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import org.foodos.restaurant.entity.enums.LicenseType;
import org.foodos.restaurant.entity.enums.RestaurantType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRestaurantRequestDto {

    /* ================= BASIC INFO ================= */

    @NotBlank(message = "Restaurant name is required")
    @Size(max = 200)
    private String name;

    @Size(max = 200)
    private String businessName;

    /* ================= CONTACT ================= */

    @NotBlank
    @Size(max = 15)
    private String phoneNumber;

    @Email
    @Size(max = 100)
    private String email;

    /* ================= ADDRESS ================= */

    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 10)
    private String postalCode;

    /* ================= LEGAL ================= */

    @Size(max = 50)
    private String gstNumber;

    @Size(max = 50)
    private String fssaiLicense;

    @Size(max = 20)
    private String panNumber;

    @Size(max =  100)
    private String licenseKey;

    /* ================= LICENSE ================= */

    @NotNull
    private LicenseType licenseType;

    private LocalDateTime licenseExpiry;

    /* ================= RESTAURANT CONFIG ================= */

    private RestaurantType restaurantType;


    private Boolean isMultiOutlet;

    /**
     * UUID of parent restaurant (only if this is a branch / outlet)
     * Null for main restaurant
     */
    private String parentRestaurantUuid;
}
