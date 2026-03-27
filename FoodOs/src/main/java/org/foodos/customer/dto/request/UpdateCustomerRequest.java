package org.foodos.customer.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request DTO for updating customer CRM details (notes, tags, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Update customer CRM details")
public class UpdateCustomerRequest {

    @Schema(description = "Customer name", example = "John Doe")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @Schema(description = "Customer email", example = "john@example.com")
    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @Schema(description = "Customer address")
    private String address;

    @Schema(description = "CRM notes about the customer")
    private String notes;

    @Schema(description = "Comma-separated tags", example = "VIP,Regular,Birthday-March")
    @Size(max = 500, message = "Tags must be at most 500 characters")
    private String tags;
}
