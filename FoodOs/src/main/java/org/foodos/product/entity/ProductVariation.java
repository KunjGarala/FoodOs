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
@Table(name = "product_variations")
@SQLDelete(sql = "UPDATE product_variations SET is_deleted = true WHERE id = ?")
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
public class ProductVariation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variation_uuid", unique = true, nullable = false)
    @Builder.Default
    private String variationUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "short_code", length = 10)
    private String shortCode; // Short code for quick selection

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal price;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal costPrice;

    @Column(unique = true, length = 50)
    private String sku; // Stock Keeping Unit - unique identifier for inventory management

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
    private Integer sortOrder = 0; // Lower numbers appear first

    // Order items using this variation
//    @OneToMany(mappedBy = "variation", cascade = CascadeType.PERSIST)
//    @Builder.Default
//    private List<OrderItem> orderItems = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (variationUuid == null) {
            variationUuid = UUID.randomUUID().toString();
        }
    }
}