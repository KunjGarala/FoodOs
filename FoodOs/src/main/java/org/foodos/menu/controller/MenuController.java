package org.foodos.menu.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.foodos.menu.dto.MenuResponseDto;
import org.foodos.menu.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/restaurants/{restaurantUuid}/menu")
@RequiredArgsConstructor
@Tag(name = "Menu APIs", description = "APIs for fetching restaurant menu with active products")
public class MenuController {

    private final MenuService menuService;

    @Operation(
            summary = "Get restaurant menu",
            description = "Fetch complete menu for a restaurant including all active categories, products, variations, and modifier groups. " +
                    "Only returns active and non-deleted items that are available in the menu."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Menu fetched successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant not found")
    })
    @GetMapping
    public ResponseEntity<MenuResponseDto> getMenu(
            @Parameter(description = "Restaurant UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000")
            @PathVariable String restaurantUuid
    ) {
        MenuResponseDto menu = menuService.getMenu(restaurantUuid);
        return ResponseEntity.ok(menu);
    }
}
