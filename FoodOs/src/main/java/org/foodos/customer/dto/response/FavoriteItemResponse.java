package org.foodos.customer.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * Favorite/most-ordered item response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Customer's favorite item")
public class FavoriteItemResponse {

    @Schema(description = "Product name", example = "Butter Chicken")
    private String productName;

    @Schema(description = "Times ordered", example = "8")
    private Long timesOrdered;
}
