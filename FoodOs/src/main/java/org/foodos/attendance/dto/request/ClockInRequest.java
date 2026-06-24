package org.foodos.attendance.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClockInRequest {

    @NotBlank(message = "restaurantUuid is required")
    private String restaurantUuid;
}
