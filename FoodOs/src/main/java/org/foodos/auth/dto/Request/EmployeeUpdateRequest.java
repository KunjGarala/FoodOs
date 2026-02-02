package org.foodos.auth.dto.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EmployeeUpdateRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Phone number must be a valid 10-digit Indian mobile number"
    )
    private String phoneNumber;

    @Size(max = 50, message = "Employee code must not exceed 50 characters")
    private String employeeCode;

    @Size(min = 4, max = 6, message = "PIN must be 4 to 6 digits")
    @Pattern(regexp = "\\d*", message = "PIN must contain only digits")
    private String pin;

    private String role;

    private Boolean isActive;
}
