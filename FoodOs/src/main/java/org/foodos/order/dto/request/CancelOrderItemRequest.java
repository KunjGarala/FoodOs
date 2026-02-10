package org.foodos.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for cancelling an order item
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to cancel an order item")
public class CancelOrderItemRequest {

    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 200, message = "Cancellation reason cannot exceed 200 characters")
    @Schema(description = "Reason for cancellation", example = "Customer changed mind", required = true)
    private String cancellationReason;
}

