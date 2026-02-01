package org.foodos.restaurant.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.foodos.restaurant.entity.enums.LicenseType;
import org.foodos.restaurant.entity.enums.RestaurantType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRestaurantRequestDto {

    @Size(max = 200)
    private String name;

    @Size(max = 200)
    private String businessName;

    /* ================= CONTACT ================= */

    @Size(max = 15)
    private String phoneNumber;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 1000)
    private String description;

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

    private LicenseType licenseType;

    private LocalDate licenseExpiry;

    /* ================= RESTAURANT CONFIG ================= */

    private RestaurantType restaurantType;
}
