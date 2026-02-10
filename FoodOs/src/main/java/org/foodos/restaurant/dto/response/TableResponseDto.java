package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.foodos.restaurant.entity.enums.TableStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Table response with full details")
public class TableResponseDto {


    @Schema(description = "Table UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String tableUuid;

    @Schema(description = "Table number", example = "T12")
    private String tableNumber;

    @Schema(description = "Section name", example = "AC Hall")
    private String sectionName;

    @Schema(description = "Seating capacity", example = "6")
    private Integer capacity;

    @Schema(description = "Minimum capacity", example = "1")
    private Integer minCapacity;

    @Schema(description = "Current table status", example = "VACANT")
    private TableStatus status;

    @Schema(description = "Restaurant UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String restaurantUuid;

    @Schema(description = "Restaurant name", example = "FoodOs - Ahmedabad")
    private String restaurantName;

    @Schema(description = "Current order details")
    private CurrentOrderDto currentOrder;

    @Schema(description = "Current waiter UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String currentWaiterUuid;

    @Schema(description = "Current waiter name", example = "John Doe")
    private String currentWaiterName;

    @Schema(description = "Number of guests currently seated", example = "4")
    private Integer currentPax;

    @Schema(description = "Time when guests were seated")
    private LocalDateTime seatedAt;

    @Schema(description = "X-coordinate for floor plan", example = "420")
    private Integer posX;

    @Schema(description = "Y-coordinate for floor plan", example = "180")
    private Integer posY;

    @Schema(description = "Table shape", example = "RECTANGLE")
    private String shape;

    @Schema(description = "Is table active", example = "true")
    private Boolean isActive;

    @Schema(description = "Is table merged with others", example = "false")
    private Boolean isMerged;

    @Schema(description = "IDs of merged tables", example = "[11, 12]")
    private String mergedWithTableIds;

    @Schema(description = "Created timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last updated timestamp")
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Current order information")
    public static class CurrentOrderDto {
        @Schema(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
        private String orderId;

        @Schema(description = "Total order amount", example = "1250.00")
        private Double totalAmount;

        @Schema(description = "Minutes elapsed since order placed", example = "42")
        private Long elapsedMinutes;
    }
}
