package org.foodos.auth.dto.Request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

//    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Phone number must be a valid 10-digit Indian mobile number"
    )
    private String phoneNumber;

//    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    @Size(max = 50, message = "Employee code must not exceed 50 characters")
    private String employeeCode;

    @Size(min = 4, max = 6, message = "PIN must be 4 to 6 digits")
    @Pattern(regexp = "\\d*", message = "PIN must contain only digits")
    private String pin; // optional

    private String role;
}
