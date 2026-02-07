package org.foodos.product.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.product.entity.enums.SelectionType;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Filter;

import java.util.*;

@Entity
@Table(name = "modifier_groups") // Table to group modifiers for products e.g. Size, Toppings
@SQLDelete(sql = "UPDATE modifier_groups SET is_deleted = true WHERE id = ?")
@Filter(
        name = "deletedFilter",
        condition = "is_deleted = :isDeleted"
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class ModifierGroup extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "modifier_group_uuid", unique = true, nullable = false)
    @Builder.Default
    private String modifierGroupUuid = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "selection_type", nullable = false)
    @Builder.Default
    private SelectionType selectionType = SelectionType.SINGLE;

    @Column(name = "min_selection")
    @Builder.Default
    private Integer minSelection = 0;

    @Column(name = "max_selection")
    @Builder.Default
    private Integer maxSelection = 1;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private Boolean isRequired = false;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ===== RELATIONSHIPS =====

    // Modifiers in this group
    @OneToMany(mappedBy = "modifierGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Modifier> modifiers = new ArrayList<>();

    // Many-to-Many with Products
    @ManyToMany(mappedBy = "modifierGroups", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Product> products = new HashSet<>();


    // Helper methods
    public void addModifier(Modifier modifier) {
        modifiers.add(modifier);
        modifier.setModifierGroup(this);
    }

    public void removeModifier(Modifier modifier) {
        modifiers.remove(modifier);
        modifier.setModifierGroup(null);
    }
}