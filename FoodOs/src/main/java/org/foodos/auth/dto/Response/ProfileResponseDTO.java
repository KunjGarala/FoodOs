package org.foodos.auth.dto.Response;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.auth.entity.UserRole;
import org.foodos.restaurant.dto.response.RestaurantBasicDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "User profile information")
public class ProfileResponseDTO {

    // ===================== IDENTIFIERS =====================
    @Schema(description = "Unique UUID for user", example = "550e8400-e29b-41d4-a716-446655440000")
    private String userUuid;

    // ===================== AUTH =====================
    @Schema(description = "Username for login", example = "john.doe")
    private String username;

    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "User role in the system")
    private UserRole role;

    @Schema(description = "Indicates if user has PIN configured")
    @JsonProperty("hasPin")
    private boolean hasPin;

    // ===================== PROFILE =====================
    @Schema(description = "User's full name", example = "John Doe")
    private String fullName;

    @Schema(description = "Phone number", example = "+1234567890")
    private String phoneNumber;

    @Schema(description = "Employee code/ID", example = "EMP001")
    private String employeeCode;

    // ===================== MULTI-TENANT =====================
    @Schema(description = "List of restaurants user has access to")
    private Set<RestaurantBasicDTO> restaurants;

    @Schema(description = "Primary restaurant details")
    private RestaurantBasicDTO primaryRestaurant;

    @Schema(description = "Primary restaurant UUID")
    @JsonProperty("primaryRestaurantUuid")
    private String primaryRestaurantUuid;

    // ===================== SECURITY STATUS =====================
    @Schema(description = "Whether account is active", example = "true")
    private Boolean isActive;

    @Schema(description = "Whether account is locked", example = "false")
    private Boolean isLocked;

    @Schema(description = "Whether password change is forced", example = "false")
    private Boolean forcePasswordChange;

    // ===================== PAY INFORMATION =====================
    @Schema(description = "Hourly wage rate", example = "15.50")
    private BigDecimal hourlyRate;

    @Schema(description = "Commission percentage", example = "2.50")
    private BigDecimal commissionPercentage;

    // ===================== PREFERENCES =====================
    @Schema(description = "Assigned restaurant sections", example = "Kitchen,Bar")
    private String assignedSections;

    @Schema(description = "Preferred language", example = "en")
    private String preferredLanguage;

    @Schema(description = "Timezone", example = "Asia/Kolkata")
    private String timezone;

    // ===================== SESSION INFO =====================
    @Schema(description = "Last login timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLoginAt;

    @Schema(description = "Last login IP address", example = "192.168.1.1")
    private String lastLoginIp;

    @Schema(description = "Password last changed timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime passwordChangedAt;

    // ===================== AUDIT =====================
    @Schema(description = "Account creation timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Schema(description = "Account last update timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // ===================== HELPER METHODS =====================
    @Schema(description = "User's display name (first name or full name)")
    public String getDisplayName() {
        if (fullName == null || fullName.trim().isEmpty()) {
            return username;
        }
        String[] names = fullName.split("\\s+");
        return names.length > 0 ? names[0] : fullName;
    }

    @Schema(description = "Whether user is an owner role")
    @JsonProperty("isOwner")
    public boolean isOwner() {
        return UserRole.OWNER.equals(role);
    }

    @Schema(description = "Whether user is an admin role")
    @JsonProperty("isAdmin")
    public boolean isAdmin() {
        return UserRole.ADMIN.equals(role) || isOwner();
    }

    @Schema(description = "Whether user is a manager role")
    @JsonProperty("isManager")
    public boolean isManager() {
        return UserRole.MANAGER.equals(role) || isAdmin();
    }

    @Schema(description = "Formatted pay rate")
    public String getFormattedHourlyRate() {
        return hourlyRate != null ? "$" + hourlyRate.setScale(2).toString() : "N/A";
    }
}