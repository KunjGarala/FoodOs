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
@Schema(description = "Table status update response")
public class TableStatusResponseDto {


    @Schema(description = "Table UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String tableUuid;

    @Schema(description = "Table number", example = "T12")
    private String tableNumber;

    @Schema(description = "Current table status", example = "OCCUPIED")
    private TableStatus status;

    @Schema(description = "Current order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String currentOrderId;

    @Schema(description = "Number of guests currently seated", example = "4")
    private Integer currentPax;

    @Schema(description = "Time when guests were seated")
    private LocalDateTime occupiedSince;

    @Schema(description = "Waiter UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String waiterUuid;


    @Schema(description = "Waiter name", example = "John Doe")
    private String waiterName;
}
