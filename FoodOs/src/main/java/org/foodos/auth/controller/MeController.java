package org.foodos.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.foodos.auth.dto.Response.MeContextResponse;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.service.MeService;
import org.foodos.restaurant.dto.response.RestaurantBasicDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Who am I + what can I see" endpoints, called by the frontend on app mount.
 * Reachable by any authenticated user (SecurityConfig: {@code anyRequest().authenticated()}).
 */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "Me", description = "Authenticated user's bootstrap context (identity + accessible outlets)")
public class MeController {

    private final MeService meService;

    @GetMapping("/context")
    @Operation(summary = "Identity + accessible outlets for the current user (display hint, not an authz source)")
    public ResponseEntity<MeContextResponse> context(
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        return ResponseEntity.ok(meService.getContext(currentUser.getUserUuid()));
    }

    @GetMapping("/restaurants")
    @Operation(summary = "Just the accessible outlets for the current user, primary first")
    public ResponseEntity<List<RestaurantBasicDTO>> restaurants(
            @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        return ResponseEntity.ok(meService.getContext(currentUser.getUserUuid()).getRestaurants());
    }
}
