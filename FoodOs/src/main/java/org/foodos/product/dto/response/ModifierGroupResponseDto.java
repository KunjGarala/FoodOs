package org.foodos.product.dto.response;

import lombok.Data;
import org.foodos.product.entity.enums.SelectionType;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ModifierGroupResponseDto {

    private Long id;
    private String modifierGroupUuid;
    private String restaurantUuid;
    private String restaurantName;
    private String name;
    private SelectionType selectionType;
    private Integer minSelection;
    private Integer maxSelection;
    private Boolean isRequired;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private List<ModifierResponseDto> modifiers;
}
