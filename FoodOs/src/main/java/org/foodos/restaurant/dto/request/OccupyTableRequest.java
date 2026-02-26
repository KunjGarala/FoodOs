package org.foodos.restaurant.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.foodos.order.entity.enums.OrderType;

@Data
@Schema(description = "Request to occupy a table")
public class OccupyTableRequest {

    @NotNull(message = "Order type is required")
    @Schema(description = "Type of order", example = "DINE_IN", required = true)
    private OrderType orderType;

    @Min(value = 1, message = "Number of guests must be at least 1")
    @Schema(description = "Number of guests", example = "2", defaultValue = "1")
    private Integer numberOfGuests = 1;

    @Size(max = 100, message = "Customer name cannot exceed 100 characters")
    @Schema(description = "Customer name", example = "John Doe")
    private String customerName;

    @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Invalid phone number format")
    @Schema(description = "Customer phone (optional)", example = "+919876543210")
    private String customerPhone;

    @Email(message = "Invalid email format")
    @Schema(description = "Customer email (optional)", example = "john@example.com")
    private String customerEmail;

    @Schema(description = "UUID of the waiter to assign to this table", example = "550e8400-e29b-41d4-a716-446655440000")
    private String waiterUuid;
}