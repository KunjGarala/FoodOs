package org.foodos.restaurant.entity;

import jakarta.persistence.*;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.product.entity.Category;
import org.foodos.product.entity.ModifierGroup;
import org.foodos.restaurant.entity.enums.LicenseType;
import org.foodos.restaurant.entity.enums.RestaurantType;
import org.hibernate.annotations.*;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "restaurants")
@SQLDelete(sql = "UPDATE restaurants SET is_active = false, deleted_at = now() WHERE id = ?")
@FilterDef(
        name = "activeFilter",
        parameters = @ParamDef(name = "isActive", type = Boolean.class)
)
@Filter(
        name = "activeFilter",
        condition = "is_active = :isActive"
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_uuid", unique = true, nullable = false, updatable = false)
    private String restaurantUuid = UUID.randomUUID().toString();

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "business_name", length = 200)
    private String businessName; //

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 1000)
    private String description;


    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(length = 100)
    private String email;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "fssai_license", length = 50)
    private String fssaiLicense;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "license_key", unique = true, length = 100)
    private String licenseKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "license_type", nullable = false)
    @Builder.Default
    private LicenseType licenseType = LicenseType.TRIAL;

    @Column(name = "license_expiry")
    private LocalDateTime licenseExpiry;


    @Enumerated(EnumType.STRING)
    @Column(name = "restaurant_type")
    private RestaurantType restaurantType;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "is_multi_outlet")
    @Builder.Default
    private Boolean isMultiOutlet = false;

    // Parent restaurant for franchise chains
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_restaurant_id")
    private Restaurant parentRestaurant;

    // Child outlets (for franchise chains)
    @OneToMany(mappedBy = "parentRestaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Restaurant> childRestaurants = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserAuthEntity owner;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ===== RELATIONSHIPS =====

    @ManyToMany(mappedBy = "restaurants", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<UserAuthEntity> employees = new HashSet<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RestaurantTable> tables = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Category> categories = new ArrayList<>();

//    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<Order> orders = new ArrayList<>();
//
//    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<Customer> customers = new ArrayList<>();
//
//    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<Ingredient> ingredients = new ArrayList<>();

//    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<Supplier> suppliers = new ArrayList<>();

//    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<TaxGroup> taxGroups = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ModifierGroup> modifierGroups = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (restaurantUuid == null) {
            restaurantUuid = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper methods for bidirectional relationships
//    public void addUser(User user) {
//        users.add(user);
//        user.setRestaurant(this);
//    }
//
//    public void removeUser(User user) {
//        users.remove(user);
//        user.setRestaurant(null);
//    }

    public void addTable(RestaurantTable table) {
        tables.add(table);
        table.setRestaurant(this);
    }

    public void addCategory(Category category) {
        categories.add(category);
        category.setRestaurant(this);
    }

    public void addChildRestaurant(Restaurant child) {
        childRestaurants.add(child);
        child.setParentRestaurant(this);
        child.setOwner(this.owner); // Inherit owner
    }

    public boolean isParentRestaurant() {
        return parentRestaurant == null && !childRestaurants.isEmpty();
    }

    public boolean isChildRestaurant() {
        return parentRestaurant != null;
    }

    public Restaurant getRootRestaurant() {
        return parentRestaurant == null ? this : parentRestaurant.getRootRestaurant();
    }

    public void removeChildRestaurant(Restaurant child) {
        childRestaurants.remove(child);
        child.setParentRestaurant(null);
    }

    public List<Restaurant> getAllChildRestaurants() {
        return new ArrayList<>(childRestaurants);
    }

    public List<Restaurant> getAllActiveChildRestaurants() {
        List<Restaurant> activeChildren = new ArrayList<>();
        for (Restaurant child : childRestaurants) {
            if (Boolean.TRUE.equals(child.getIsActive())) {
                activeChildren.add(child);
            }
        }
        return activeChildren;
    }



}