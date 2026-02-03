package org.foodos.product.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "modifiers")
@SQLDelete(sql = "UPDATE modifiers SET is_deleted = true WHERE id = ?")
@FilterDef(
        name = "deletedFilter",
        parameters = @ParamDef(name = "isDeleted", type = Boolean.class)
)
@Filter(
        name = "deletedFilter",
        condition = "is_deleted = :isDeleted"
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Modifier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "modifier_uuid", unique = true, nullable = false)
    @Builder.Default
    private String modifierUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifier_group_id", nullable = false)
    private ModifierGroup modifierGroup;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "price_add", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private java.math.BigDecimal priceAdd = java.math.BigDecimal.ZERO;

    @Column(name = "cost_add", precision = 10, scale = 2)
    private java.math.BigDecimal costAdd;

    @Column(length = 50)
    private String sku;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    // Order item modifiers using this modifier
//    @OneToMany(mappedBy = "modifier", cascade = CascadeType.PERSIST)
//    @Builder.Default
//    private List<OrderItemModifier> orderItemModifiers = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (modifierUuid == null) {
            modifierUuid = UUID.randomUUID().toString();
        }
    }
}