package org.foodos.product.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.order.entity.OrderItem;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.product.entity.enums.DietaryType;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Filter;

import java.util.*;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_sku", columnList = "sku"),
        @Index(name = "idx_name", columnList = "name")
})
@SQLDelete(sql = "UPDATE products SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(
        name = "deletedFilter",
        condition = "is_deleted = :isDeleted"
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Product extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_uuid", unique = true, nullable = false)
    @Builder.Default
    private String productUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(unique = true, length = 50)
    private String sku; // Stock Keeping Unit - unique identifier for inventory management

    @Column(name = "food_code", length = 20)
    private String foodCode;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal basePrice; //price for the default variation (e.g., medium pizza price) - used for reporting and as fallback if variations are not defined

    @Column(name = "cost_price", precision = 10, scale = 2)
    private java.math.BigDecimal costPrice; //

    @Column(name = "takeaway_price", precision = 10, scale = 2)
    private java.math.BigDecimal takeawayPrice;

    @Column(name = "delivery_price", precision = 10, scale = 2)
    private java.math.BigDecimal deliveryPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "dietary_type", nullable = false)
    @Builder.Default
    private DietaryType dietaryType = DietaryType.VEG;

    // ===== RELATIONSHIPS =====

    // Product variations (sizes)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductVariation> variations = new ArrayList<>(); // e.g., Small, Medium, Large pizza sizes

    // Many-to-Many with ModifierGroups
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_modifier_groups",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "modifier_group_id")
    )
    @Builder.Default
    private Set<ModifierGroup> modifierGroups = new HashSet<>(); // e.g., Extra Toppings, Sides

    // Recipes (ingredients)
//    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<Recipe> recipes = new ArrayList<>(); // Ingredients for the product
//
//    // Order items
    @OneToMany(mappedBy = "product", cascade = CascadeType.PERSIST)
    @Builder.Default
    private List<OrderItem> orderItems = new ArrayList<>(); // Order items containing this product

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "preparation_time")
    private Integer preparationTime;

//    @Column(name = "calories")
//    private Integer calories;

    @Column(name = "spice_level")
    private Integer spiceLevel; // 1 to 5 scale for spiciness

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;


    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false; // Featured products appear prominently in the menu ex: chef's special items restaurant wants to highlight

    @Column(name = "is_bestseller", nullable = false)
    @Builder.Default
    private Boolean isBestseller = false; // Bestsellers are popular items based on sales data

    @Column(name = "has_variations", nullable = false)
    @Builder.Default
    private Boolean hasVariations = false; // true if product has size or type variations

    @Column(name = "has_modifiers", nullable = false)
    @Builder.Default
    private Boolean hasModifiers = false; // true if product can have extra add-ons or customizations

    @Column(name = "is_open_price", nullable = false)
    @Builder.Default
    private Boolean isOpenPrice = false; // true if price is set at order time (e.g., donations, custom items)

    @Column(name = "track_inventory", nullable = false)
    @Builder.Default
    private Boolean trackInventory = true; // true if inventory levels are tracked for this product (e.g., ingredients stock)

    @Column(name = "current_stock", precision = 10, scale = 2)
    private java.math.BigDecimal currentStock; // Current inventory level

    @Column(name = "low_stock_alert", precision = 10, scale = 2)
    private java.math.BigDecimal lowStockAlert; // Threshold to trigger low stock alert

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0; // Lower numbers appear first in listings

    @Column(name = "available_from")
    private java.time.LocalTime availableFrom;

    @Column(name = "available_to")
    private java.time.LocalTime availableTo;

    @Column(name = "available_days", length = 50)
    private String availableDays;

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private Long soldCount = 0L; // Total number of units sold



    // Helper methods
    public void addVariation(ProductVariation variation) {
        variations.add(variation);
        variation.setProduct(this);
    }

    public void addModifierGroup(ModifierGroup modifierGroup) {
        modifierGroups.add(modifierGroup);
        modifierGroup.getProducts().add(this);
    }

    public void removeModifierGroup(ModifierGroup modifierGroup) {
        modifierGroups.remove(modifierGroup);
        modifierGroup.getProducts().remove(this);
    }

//    public void addRecipe(Recipe recipe) {
//        recipes.add(recipe);
//        recipe.setProduct(this);
//    }
}
