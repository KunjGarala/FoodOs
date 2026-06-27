package org.foodos.auth.dto.Response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Role definition with permissions for RBAC matrix")
public class RoleResponse {

    @Schema(description = "Role name (enum value)", example = "MANAGER")
    private String name;

    @Schema(description = "Numeric hierarchical level (higher = more privileged)", example = "80")
    private Integer level;

    @Schema(description = "Human-readable role label", example = "Store Manager")
    private String displayName;

    @Schema(description = "Permission strings granted by this role")
    private List<String> permissions;
}
