package org.foodos.auth.DTO.Request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO for updating user profile")
public class ProfileUpdateDTO {

    @Schema(description = "User's full name", example = "John Doe")
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Schema(description = "Email address", example = "john.doe@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Schema(description = "Phone number", example = "+1234567890")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone number must be valid")
    private String phoneNumber;

    @Schema(description = "Preferred language", example = "en")
    @Size(max = 10, message = "Language code cannot exceed 10 characters")
    private String preferredLanguage;

    @Schema(description = "Timezone", example = "Asia/Kolkata")
    @Size(max = 50, message = "Timezone cannot exceed 50 characters")
    private String timezone;

    @Schema(description = "Employee code/ID", example = "EMP001")
    @Size(max = 20, message = "Employee code cannot exceed 20 characters")
    private String employeeCode;

    @Schema(description = "Assigned sections", example = "Kitchen,Bar")
    private String assignedSections;

    @Schema(description = "Hourly rate", example = "15.50")
    private BigDecimal hourlyRate;

    @Schema(description = "Commission percentage", example = "2.50")
    private BigDecimal commissionPercentage;

    @Schema(description = "Primary restaurant ID", example = "1")
    private Long primaryRestaurantId;
}