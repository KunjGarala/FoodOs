package org.foodos.restaurant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import org.foodos.order.dto.response.OrderResponse;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TableDetailResponse {
    private TableResponseDto table;
    private OrderResponse activeOrder;   // null if table is vacant
}