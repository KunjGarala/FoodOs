package org.foodos.auth.dto.Response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.restaurant.dto.response.RestaurantBasicDTO;

import java.util.List;

/**
 * Bootstrap payload returned by {@code GET /api/me/context}, called once on app mount.
 *
 * <p>This is the <b>display hint</b> for the frontend — it tells the UI which outlet
 * picker buttons to draw. It is deliberately NOT an authorization source: every scoped
 * action is still validated server-side against {@code user_restaurants} via
 * {@code UserAuthEntity.canAccessRestaurant(...)}. Replacing the old JWT outlet claim
 * with this endpoint keeps the token small and lets the picker stay fresh (the cache is
 * evicted when a user's access / primary outlet / role / active status changes), but it
 * does not change multi-tenancy enforcement at all.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Identity + accessible outlets for the authenticated user (display hint, not an authz source)")
public class MeContextResponse {

    @Schema(description = "Who the authenticated user is")
    private UserContext user;

    @Schema(description = "Outlets the user can see, primary outlet first")
    private List<RestaurantBasicDTO> restaurants;

    @Schema(description = "The user's primary/default outlet")
    private RestaurantBasicDTO primaryRestaurant;

    @Schema(description = "Primary outlet UUID, for convenience")
    @JsonProperty("primaryRestaurantUuid")
    private String primaryRestaurantUuid;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Coarse identity of the authenticated user")
    public static class UserContext {

        @Schema(description = "User UUID", example = "550e8400-e29b-41d4-a716-446655440000")
        private String userUuid;

        @Schema(description = "Username", example = "john.doe")
        private String username;

        @Schema(description = "Full name", example = "John Doe")
        private String fullName;

        @Schema(description = "Coarse role", example = "MANAGER")
        private String role;

        @Schema(description = "Profile picture URL")
        private String profilePictureUrl;

        @Schema(description = "Whether the user has a PIN configured")
        @JsonProperty("hasPin")
        private boolean hasPin;
    }
}
