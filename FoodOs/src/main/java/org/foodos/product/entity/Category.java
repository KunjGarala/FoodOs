package org.foodos.product.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLRestriction;

import java.util.*;

@Entity
@Table(name = "categories", indexes = {
        @Index(name = "idx_sort_order", columnList = "sort_order")
})
@SQLDelete(sql = "UPDATE categories SET is_deleted = true, deleted_at = now() WHERE id = ?")
//@Filter(
//        name = "deletedFilter",
//        condition = "is_deleted = :isDeleted"
//)
@SQLRestriction("is_deleted = false")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Category extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_uuid", unique = true, nullable = false)
    @Builder.Default
    private String categoryUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Self-referencing for hierarchical categories
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id")
    private Category parentCategory; // ex : "Beverages" as parent of "Soft Drinks"

    @OneToMany(mappedBy = "parentCategory", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Category> subCategories = new ArrayList<>(); // Sub-categories

    // Products in this category
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;// Lower numbers appear first

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "icon_name", length = 50)
    private String iconName;

    @Column(name = "color_code", length = 7)
    @Builder.Default
    private String colorCode = "#000000";


    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_visible_in_menu", nullable = false)
    @Builder.Default
    private Boolean isVisibleInMenu = true;

    @Column(name = "available_for_dine_in", nullable = false)
    @Builder.Default
    private Boolean availableForDineIn = true;

//    @Column(name = "available_for_takeaway", nullable = false)
//    private Boolean availableForTakeaway = true;



    // Helper methods
    public void addProduct(Product product) {
        products.add(product);
        product.setCategory(this);
    }

    public void addSubCategory(Category category) {
        subCategories.add(category);
        category.setParentCategory(this);
    }
}
