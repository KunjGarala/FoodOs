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
@Schema(description = "Simplified table response for floor plan view")
public class TableFloorPlanDto {


    @Schema(description = "Table UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String tableUuid;

    @Schema(description = "Table number", example = "T1")
    private String tableNumber;

    @Schema(description = "Section name", example = "AC Hall")
    private String sectionName;

    @Schema(description = "Current table status", example = "OCCUPIED")
    private TableStatus status;

    @Schema(description = "Seating capacity", example = "4")
    private Integer capacity;

    @Schema(description = "Number of guests currently seated", example = "3")
    private Integer currentPax;

    @Schema(description = "Time when guests were seated")
    private LocalDateTime seatedAt;

    @Schema(description = "Current order UUID when table is occupied")
    private String currentOrderId;

    @Schema(description = "X-coordinate for floor plan", example = "120")
    private Integer posX;

    @Schema(description = "Y-coordinate for floor plan", example = "80")
    private Integer posY;

    @Schema(description = "Table shape", example = "RECTANGLE")
    private String shape;

    @Schema(description = "Is table merged with others", example = "false")
    private Boolean isMerged;

    @Schema(description = "Current waiter UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String currentWaiterUuid;

    @Schema(description = "Current waiter name", example = "John Doe")
    private String currentWaiterName;
}
