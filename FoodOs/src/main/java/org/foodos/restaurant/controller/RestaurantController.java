package org.foodos.restaurant.controller;

import jakarta.validation.Valid;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.DTO.Response.ProfileResponseDTO;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.foodos.restaurant.dto.request.UpdateRestaurantRequestDto;
import org.foodos.restaurant.dto.response.RestaurantHierarchyResponseDto;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.service.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "Restaurant APIs", description = "APIs for managing restaurants and outlets")
public class RestaurantController {

    private final RestaurantService restaurantService;

    /* ================= CREATE FIRST ================= */

    @Operation(
            summary = "Create parent restaurant",
            description = "Creates the first (parent) restaurant for an OWNER"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Restaurant created successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "400", description = "Business rule violation")
    })
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'OWNER')")
    @PostMapping("/create-first")
    public ResponseEntity<RestaurantResponseDto> createFirstRestaurant(
            @AuthenticationPrincipal UserAuthEntity currentUser,
            @Valid @RequestBody CreateRestaurantRequestDto requestDto
    ) {
        RestaurantResponseDto restaurant =
                restaurantService.createParentRestaurant(currentUser, requestDto);

        return ResponseEntity.status(HttpStatus.CREATED).body(restaurant);
    }

    /* ================= CREATE OUTLET ================= */

    @Operation(
            summary = "Create outlet restaurant",
            description = "Creates a child restaurant under a parent restaurant but can not create another level of outlets"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Outlet created successfully"),
            @ApiResponse(responseCode = "404", description = "Parent restaurant not found"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "400", description = "Business rule violation")
    })
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'OWNER')")
    @PostMapping("/{parentRestaurantUuid}/outlets")
    public ResponseEntity<RestaurantResponseDto> createOutletRestaurant(
            @Parameter(description = "Parent restaurant UUID", required = true)
            @PathVariable String parentRestaurantUuid,

            @Valid @RequestBody CreateRestaurantRequestDto requestDto,

            @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        RestaurantResponseDto restaurant =
                restaurantService.createChildRestaurant(
                        parentRestaurantUuid,
                        requestDto,
                        currentUser
                );

        return ResponseEntity.status(HttpStatus.CREATED).body(restaurant);
    }

    /* ================= UPDATE ================= */

    @Operation(
            summary = "Update restaurant",
            description = "Updates restaurant details"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Restaurant updated successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant not found"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "400", description = "Business rule violation")
    })
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication , 'OWNER')")
    @PatchMapping("/{restaurantUuid}/update")
    public ResponseEntity<RestaurantResponseDto> updateRestaurant(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,

            @Valid @RequestBody UpdateRestaurantRequestDto requestDto,

            @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        RestaurantResponseDto restaurant =
                restaurantService.updateRestaurant(
                        restaurantUuid,
                        requestDto,
                        currentUser
                );

        return ResponseEntity.ok(restaurant);
    }




    /* ================= DELETE ================= */


    @Operation(
            summary = "Delete restaurant",
            description = "Deletes a restaurant (soft delete)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Restaurant deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant not found"),
            @ApiResponse(responseCode = "400", description = "Business rule violation"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @DeleteMapping("/{restaurantUuid}/delete" )
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication , 'OWNER')")
    public ResponseEntity<String> deleteRestaurant(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid,
            @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        restaurantService.deleteRestaurant(restaurantUuid, currentUser);
        return ResponseEntity.ok("Restaurant deleted successfully.");
    }


    /* ================= GET HIERARCHY ================= */
    @Operation(
            summary = "Get restaurant hierarchy",
            description = "Fetch parent restaurant along with all its outlets"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Hierarchy fetched successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant not found"),
            @ApiResponse(responseCode = "400", description = "Business rule violation")
    })
    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication , 'OWNER')")
    @GetMapping("/{restaurantUuid}/hierarchy")
    public ResponseEntity<RestaurantHierarchyResponseDto> getRestaurantHierarchy(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid
    ) {
        RestaurantHierarchyResponseDto hierarchy =
                restaurantService.getRestaurantHierarchy(restaurantUuid);

        return ResponseEntity.ok(hierarchy);
    }

    /* ================= GET DETAIL ================= */
    @Operation(
            summary = "Get restaurant detail",
            description = "Fetch detailed information of a restaurant"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Restaurant details fetched successfully"),
            @ApiResponse(responseCode = "404", description = "Restaurant not found")
    })
    @GetMapping("/{restaurantUuid}/detail" )
    public ResponseEntity<RestaurantResponseDto> getRestaurantDetail(
            @Parameter(description = "Restaurant UUID", required = true)
            @PathVariable String restaurantUuid
    ) {
        RestaurantResponseDto restaurant =
                restaurantService.getRestaurantDetail(restaurantUuid);

        return ResponseEntity.ok(restaurant);
    }



    @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
    @GetMapping("/employees")
    public ResponseEntity<List<ProfileResponseDTO>> getAllEmployeesByRole(
            @Parameter(description = "User Role", required = true)
            @RequestParam String role,

            @Parameter(description = "Restaurant UUID (optional for OWNER / ADMIN)")
            @RequestParam(required = false) String restaurantUuid,

            @AuthenticationPrincipal UserAuthEntity currentUser
    ) {
        List<ProfileResponseDTO> employees =
                restaurantService.getAllEmployeesByRole(role, restaurantUuid, currentUser);

        return ResponseEntity.ok(employees);
    }







}
