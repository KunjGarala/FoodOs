package org.foodos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_username", columnList = "username"),
                @Index(name = "idx_email", columnList = "email"),
                @Index(name = "idx_pin", columnList = "pin")
        }
)
@SQLDelete(sql = "UPDATE users SET is_deleted = true, deleted_at = now() WHERE id = ?")
@Filter(
        name = "deletedFilter",
        condition = "is_deleted = :isDeleted"
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserAuthEntity extends BaseSoftDeleteEntity implements UserDetails {

    // ===================== CORE =====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_uuid", unique = true, nullable = false, updatable = false)
    @Builder.Default
    private String userUuid = UUID.randomUUID().toString();

    // ===================== MULTI TENANT =====================

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_restaurants",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "restaurant_id")
    )
    @Builder.Default
    private Set<Restaurant> restaurants = new HashSet<>(); // restaurants the user has access to

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_restaurant_id")
    private Restaurant primaryRestaurant; // primary restaurant for the user

    // ===================== AUTH =====================

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 6)
    private String pin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.GUEST;

    // ===================== PROFILE =====================

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "employee_code", length = 20)
    private String employeeCode;

    @Column(name = "profile_picture_url")
    private  String profilePictureUrl;

    // ===================== SECURITY FLAGS =====================
    @Column(name = "email_verified")
    private  String emailVerificationCode;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;


    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "force_password_change", nullable = false)
    @Builder.Default
    private Boolean forcePasswordChange = false;

    // ===================== SESSION =====================

    @Column(name = "current_session_token", length = 255)
    private String currentSessionToken;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    // ===================== PAY =====================

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "commission_percentage", precision = 5, scale = 2)
    private BigDecimal commissionPercentage;

    // ===================== METADATA =====================

    @Column(name = "assigned_sections", columnDefinition = "TEXT")
    private String assignedSections;

    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "en";

    @Column(length = 50)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    // ===================== AUDIT =====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserAuthEntity createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private UserAuthEntity updatedByUser;


    // ===================== RELATIONSHIPS =====================

//    @OneToMany(mappedBy = "waiter", cascade = CascadeType.PERSIST)
//    @Builder.Default
//    private List<Order> ordersAsWaiter = new ArrayList<>();
//
//    @OneToMany(mappedBy = "cashier", cascade = CascadeType.PERSIST)
//    @Builder.Default
//    private List<Order> ordersAsCashier = new ArrayList<>();
//
//    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<Attendance> attendanceRecords = new ArrayList<>();
//
//    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
//    @Builder.Default
//    private List<CashDrawerSession> cashDrawerSessions = new ArrayList<>();
//
//    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
//    @Builder.Default
//    private List<AuditLog> auditLogs = new ArrayList<>();

    // ===================== JPA CALLBACKS =====================



    // ===================== USER DETAILS =====================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (Boolean.TRUE.equals(isLocked) && lockedUntil != null) {
            if (LocalDateTime.now().isAfter(lockedUntil)) {
                unlockAccount(); // auto unlock
                return true;
            }
            return false;
        }
        return !Boolean.TRUE.equals(isLocked);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(isActive) && !Boolean.TRUE.equals(isDeleted);
    }

    // ===================== SECURITY HELPERS =====================

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 30;

    public void onLoginFailure() {
        failedLoginAttempts++;
        if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            lockAccount();
        }
    }

    public void  resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
    }

    public void onLoginSuccess() {
        unlockAccount();
        lastLoginAt = LocalDateTime.now();
    }

    public void lockAccount() {
        isLocked = true;
        lockedUntil = LocalDateTime.now().plusMinutes(LOCK_MINUTES);
    }

    public void unlockAccount() {
        isLocked = false;
        lockedUntil = null;
        failedLoginAttempts = 0;
    }

    // ===================== ROLE HELPERS =====================

    public void addRestaurant(Restaurant restaurant) {
        restaurants.add(restaurant);
        restaurant.getEmployees().add(this);

        // Set as primary if first restaurant
        if (primaryRestaurant == null) {
            primaryRestaurant = restaurant;
        }
    }

    public void removeRestaurant(Restaurant restaurant) {
        restaurants.remove(restaurant);
        restaurant.getEmployees().remove(this);

        // Update primary if removed
        if (primaryRestaurant != null && primaryRestaurant.equals(restaurant)) {
            primaryRestaurant = restaurants.isEmpty() ? null : restaurants.iterator().next();
        }
    }

    public boolean canAccessRestaurant(Long restaurantId) {
        return restaurants.stream()
                .anyMatch(r -> r.getId().equals(restaurantId));
    }

    public boolean isOwner() {
        return role == UserRole.OWNER;
    }

    public boolean hasRole(UserRole requiredRole) {
        return this.role == requiredRole;
    }

    public boolean hasPermissionLevel(UserRole requiredLevel) {
        return this.role.getLevel() >= requiredLevel.getLevel();
    }

    // ===================== PIN HELPERS =====================

    public boolean hasPin() {
        return pin != null && !pin.isBlank();
    }

    public boolean matchesPin(String rawPin) {
        return pin != null && pin.equals(rawPin);
    }
}
