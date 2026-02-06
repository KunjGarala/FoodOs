package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Restaurant chain tables summary")
public class RestaurantChainTablesSummaryDto {

    @Schema(description = "Restaurant ID", example = "1")
    private Long restaurantId;

    @Schema(description = "Restaurant UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String restaurantUuid;

    @Schema(description = "Restaurant name", example = "FoodOs – Ahmedabad")
    private String restaurantName;

    @Schema(description = "Total tables count", example = "22")
    private Integer totalTables;

    @Schema(description = "Occupied tables count", example = "10")
    private Integer occupied;

    @Schema(description = "Vacant tables count", example = "9")
    private Integer vacant;

    @Schema(description = "Billed tables count", example = "3")
    private Integer billed;

    @Schema(description = "Dirty tables count", example = "0")
    private Integer dirty;

    @Schema(description = "Reserved tables count", example = "0")
    private Integer reserved;
}
