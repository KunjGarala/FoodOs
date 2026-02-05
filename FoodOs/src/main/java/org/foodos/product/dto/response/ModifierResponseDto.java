package org.foodos.product.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ModifierResponseDto {

    private Long id;
    private String modifierUuid;
    private String modifierGroupUuid;
    private String modifierGroupName;
    private String name;
    private BigDecimal priceAdd;
    private BigDecimal costAdd;
    private String sku;
    private Boolean isDefault;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
