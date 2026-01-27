package org.foodos.auth.DTO.Response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.auth.entity.UserRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Basic user information")
public class UserBasicDTO {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "User UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String userUuid;

    @Schema(description = "Username", example = "john.doe")
    private String username;

    @Schema(description = "Full name", example = "John Doe")
    private String fullName;

    @Schema(description = "Email", example = "john.doe@example.com")
    private String email;

    @Schema(description = "User role")
    private UserRole role;

    @Schema(description = "Employee code", example = "EMP001")
    private String employeeCode;

    @Schema(description = "Primary restaurant ID", example = "1")
    private Long primaryRestaurantId;

    @Schema(description = "Whether user is active", example = "true")
    private Boolean isActive;

    @Schema(description = "User's display name")
    public String getDisplayName() {
        if (fullName != null && !fullName.trim().isEmpty()) {
            String[] names = fullName.split("\\s+");
            return names.length > 0 ? names[0] : fullName;
        }
        return username;
    }
}