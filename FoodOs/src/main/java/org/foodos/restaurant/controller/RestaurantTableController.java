package org.foodos.restaurant.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.restaurant.dto.request.*;
import org.foodos.restaurant.dto.response.*;
import org.foodos.restaurant.entity.enums.TableStatus;
import org.foodos.restaurant.service.RestaurantTableService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tables")
@Slf4j
@RequiredArgsConstructor
@Tag(name = "Table Management APIs", description = "Comprehensive table management for restaurants - CRUD, status updates, floor plans, merging, transfers, and analytics")
public class RestaurantTableController {

        private final RestaurantTableService tableService;

        /**
         * 1️⃣ Create Table
         */
        @Operation(summary = "Create a new table", description = "Creates a new table for a restaurant with specified capacity and floor position")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Table created successfully", content = @Content(schema = @Schema(implementation = TableResponseDto.class))),
                        @ApiResponse(responseCode = "400", description = "Validation error or business rule violation"),
                        @ApiResponse(responseCode = "404", description = "Restaurant not found"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
        @PostMapping
        public ResponseEntity<TableResponseDto> createTable(
                        @Valid @RequestBody CreateTableRequestDto requestDto,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("POST /api/v1/tables - Create table request by user: {}", currentUser.getUsername());
                TableResponseDto response = tableService.createTable(requestDto, currentUser);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        /**
         * 2️⃣ Update Table
         */
        @Operation(summary = "Update table details", description = "Updates table configuration (capacity, position, section) but not status")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Table updated successfully", content = @Content(schema = @Schema(implementation = TableResponseDto.class))),
                        @ApiResponse(responseCode = "404", description = "Table not found"),
                        @ApiResponse(responseCode = "400", description = "Validation error"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
        @PutMapping("/{tableUuid}")
        public ResponseEntity<TableResponseDto> updateTable(
                        @Parameter(description = "Table UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String tableUuid,
                        @Valid @RequestBody UpdateTableRequestDto requestDto,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("PUT /api/v1/tables/{} - Update table request by user: {}", tableUuid,
                                currentUser.getUsername());
                TableResponseDto response = tableService.updateTable(tableUuid, requestDto, currentUser);
                return ResponseEntity.ok(response);
        }

        /**
         * 3️⃣ Update Table Status
         */
        @Operation(summary = "Update table status", description = "Changes table lifecycle status (VACANT → OCCUPIED → BILLED → DIRTY → VACANT)")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Table status updated successfully", content = @Content(schema = @Schema(implementation = TableStatusResponseDto.class))),
                        @ApiResponse(responseCode = "404", description = "Table not found"),
                        @ApiResponse(responseCode = "400", description = "Invalid status transition"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        @PatchMapping("/{tableUuid}/status")
        public ResponseEntity<TableStatusResponseDto> updateTableStatus(
                        @Parameter(description = "Table UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String tableUuid,
                        @Valid @RequestBody UpdateTableStatusRequestDto requestDto,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("PATCH /api/v1/tables/{}/status - Update status to {} by user: {}",
                                tableUuid, requestDto.getStatus(), currentUser.getUsername());
                TableStatusResponseDto response = tableService.updateTableStatus(tableUuid, requestDto, currentUser);
                return ResponseEntity.ok(response);
        }

        /**
         * 4️⃣ Get Table by ID
         */
        @Operation(summary = "Get table by ID", description = "Fetches single table with live status and current order information")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Table fetched successfully", content = @Content(schema = @Schema(implementation = TableResponseDto.class))),
                        @ApiResponse(responseCode = "404", description = "Table not found"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        @GetMapping("/{tableUuid}")
        public ResponseEntity<TableResponseDto> getTableById(
                        @Parameter(description = "Table UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String tableUuid,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("GET /api/v1/tables/{} - Fetch table by user: {}", tableUuid, currentUser.getUsername());
                TableResponseDto response = tableService.getTableById(tableUuid);
                return ResponseEntity.ok(response);
        }

        /**
         * 5️⃣ Get All Tables (Admin/Manager)
         */
        @Operation(summary = "Get all tables (paginated)", description = "Fetches all tables across all restaurants with optional status filter")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Tables fetched successfully", content = @Content(schema = @Schema(implementation = Page.class))),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
        @GetMapping
        public ResponseEntity<Page<TableResponseDto>> getAllTables(
                        @Parameter(description = "Page number (0-based)", example = "0") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
                        @Parameter(description = "Filter by status", schema = @Schema(allowableValues = { "VACANT",
                                        "OCCUPIED", "BILLED", "DIRTY",
                                        "RESERVED" })) @RequestParam(required = false) TableStatus status,
                        @RequestParam String restaurantUuid,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("GET /api/v1/tables - Fetch all tables. Page: {}, Size: {}, Status: {}, User: {}",
                                page, size, status, currentUser.getUsername());
                Pageable pageable = PageRequest.of(page, size);
                Page<TableResponseDto> response = tableService.getAllTables(pageable, status, restaurantUuid);
                return ResponseEntity.ok(response);
        }

        /**
         * 6️⃣ Get Tables by Restaurant (Floor Plan View)
         */
        @Operation(summary = "Get tables by restaurant (floor plan)", description = "Fetches all tables for a specific restaurant with position coordinates for POS floor plan view")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Tables fetched successfully", content = @Content(schema = @Schema(implementation = TableFloorPlanDto.class))),
                        @ApiResponse(responseCode = "404", description = "Restaurant not found"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        @GetMapping("/restaurant/{restaurantUuid}")
        public ResponseEntity<List<TableFloorPlanDto>> getTablesByRestaurant(
                        @Parameter(description = "Restaurant UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String restaurantUuid,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("GET /api/v1/tables/restaurant/{} - Fetch floor plan by user: {}",
                                restaurantUuid, currentUser.getUsername());
                List<TableFloorPlanDto> response = tableService.getTablesByRestaurant(restaurantUuid);
                return ResponseEntity.ok(response);
        }

        /**
         * 7️⃣ Get Tables by Restaurant Chain (Franchise)
         */
        @Operation(summary = "Get tables by restaurant chain", description = "Fetches table summaries for all outlets in a restaurant chain (multi-outlet dashboard)")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Chain table summaries fetched successfully", content = @Content(schema = @Schema(implementation = RestaurantChainTablesSummaryDto.class))),
                        @ApiResponse(responseCode = "404", description = "Parent restaurant not found"),
                        @ApiResponse(responseCode = "400", description = "Restaurant is not a parent restaurant"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'OWNER')")
        @GetMapping("/chain/{parentRestaurantUuid}")
        public ResponseEntity<List<RestaurantChainTablesSummaryDto>> getTablesByRestaurantChain(
                        @Parameter(description = "Parent restaurant UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String parentRestaurantUuid,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("GET /api/v1/tables/chain/{} - Fetch chain summary by user: {}",
                                parentRestaurantUuid, currentUser.getUsername());
                List<RestaurantChainTablesSummaryDto> response = tableService
                                .getTablesByRestaurantChain(parentRestaurantUuid);
                return ResponseEntity.ok(response);
        }

        /**
         * 8️⃣ Delete Table (Soft Delete)
         */
        @Operation(summary = "Delete table", description = "Soft deletes a table (marks as inactive). Cannot delete if table is OCCUPIED.")
        @ApiResponses({
                        @ApiResponse(responseCode = "204", description = "Table deleted successfully"),
                        @ApiResponse(responseCode = "404", description = "Table not found"),
                        @ApiResponse(responseCode = "400", description = "Cannot delete occupied table"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
        @DeleteMapping("/{tableUuid}")
        public ResponseEntity<Void> deleteTable(
                        @Parameter(description = "Table UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String tableUuid,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("DELETE /api/v1/tables/{} - Delete table by user: {}", tableUuid, currentUser.getUsername());
                tableService.deleteTable(tableUuid, currentUser);
                return ResponseEntity.noContent().build();
        }

        /**
         * 9️⃣ Merge Tables
         */
        @Operation(summary = "Merge tables", description = "Combines multiple tables for large party seating. All tables must be VACANT.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Tables merged successfully", content = @Content(schema = @Schema(implementation = MergeTablesResponseDto.class))),
                        @ApiResponse(responseCode = "404", description = "One or more tables not found"),
                        @ApiResponse(responseCode = "400", description = "Invalid merge request (tables not vacant or different restaurants)"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        @PostMapping("/merge")
        public ResponseEntity<MergeTablesResponseDto> mergeTables(
                        @Valid @RequestBody MergeTablesRequestDto requestDto,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("POST /api/v1/tables/merge - Merge tables by user: {}", currentUser.getUsername());
                MergeTablesResponseDto response = tableService.mergeTables(requestDto, currentUser);
                return ResponseEntity.ok(response);
        }

        /**
         * 🔟 Transfer Table Order
         */
        @Operation(summary = "Transfer table order", description = "Moves guests and their order from one table to another. Source must be OCCUPIED, destination must be VACANT.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Table transfer successful", content = @Content(schema = @Schema(implementation = TransferTableResponseDto.class))),
                        @ApiResponse(responseCode = "404", description = "One or both tables not found"),
                        @ApiResponse(responseCode = "400", description = "Invalid transfer request (status or restaurant mismatch)"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        @PostMapping("/transfer")
        public ResponseEntity<TransferTableResponseDto> transferTable(
                        @Valid @RequestBody TransferTableRequestDto requestDto,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("POST /api/v1/tables/transfer - Transfer table by user: {}", currentUser.getUsername());
                TransferTableResponseDto response = tableService.transferTable(requestDto, currentUser);
                return ResponseEntity.ok(response);
        }

        /**
         * 1️⃣1️⃣ Get Table Analytics
         */
        @Operation(summary = "Get table analytics", description = "Fetches table utilization analytics including occupancy rate, average turn time, and most used tables")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Analytics fetched successfully", content = @Content(schema = @Schema(implementation = TableAnalyticsDto.class))),
                        @ApiResponse(responseCode = "404", description = "Restaurant not found"),
                        @ApiResponse(responseCode = "403", description = "Access denied")
        })
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'MANAGER')")
        @GetMapping("/analytics/{restaurantUuid}")
        public ResponseEntity<TableAnalyticsDto> getTableAnalytics(
                        @Parameter(description = "Restaurant UUID", required = true, example = "550e8400-e29b-41d4-a716-446655440000") @PathVariable String restaurantUuid,
                        @Parameter(hidden = true) @AuthenticationPrincipal UserAuthEntity currentUser) {
                log.info("GET /api/v1/tables/analytics/{} - Fetch analytics by user: {}",
                                restaurantUuid, currentUser.getUsername());
                TableAnalyticsDto response = tableService.getTableAnalytics(restaurantUuid);
                return ResponseEntity.ok(response);
        }

        @PostMapping("/{tableUuid}/occupy")
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        public ResponseEntity<OrderResponse> occupyTable(
                        @PathVariable String tableUuid,
                        @Valid @RequestBody OccupyTableRequest request,
                        @AuthenticationPrincipal UserAuthEntity currentUser) {

                log.info("REST: Occupying table: {}", tableUuid);
                OrderResponse response = tableService.occupyTable(tableUuid, request, currentUser.getId());
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        @GetMapping("/{tableUuid}/details")
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        public ResponseEntity<TableDetailResponse> getTableDetails(@PathVariable String tableUuid) {
                TableDetailResponse response = tableService.getTableDetails(tableUuid);
                return ResponseEntity.ok(response);
        }

        @PostMapping("/{tableUuid}/demerge")
        @PreAuthorize("@permissionEvaluator.hasPermissionLevel(authentication, 'WAITER')")
        public ResponseEntity<TableResponseDto> demergeTable(
                        @PathVariable String tableUuid,
                        @AuthenticationPrincipal UserAuthEntity currentUser) {

                log.info("REST: Demerging table: {}", tableUuid);
                TableResponseDto response = tableService.demergeTableResponse(tableUuid, currentUser);
                return ResponseEntity.ok(response);
        }
}
// Trigger rebuild
