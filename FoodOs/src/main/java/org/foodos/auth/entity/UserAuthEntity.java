package org.foodos.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_username", columnList = "username"),
                @Index(name = "idx_email", columnList = "email"),
                @Index(name = "idx_restaurant_id", columnList = "restaurant_id"),
                @Index(name = "idx_pin", columnList = "pin")
        }
)
public class UserAuthEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * UUID for offline-first sync operations (as per SRS Section 3.2)
     * Generated client-side to prevent ID collision during offline operations
     */
    @Column(name = "user_uuid", unique = true, nullable = false, updatable = false)
    private String userUuid = UUID.randomUUID().toString();

    /**
     * Multi-tenant restaurant association (SRS Section 2.1)
     * Links user to specific restaurant/outlet
     */
    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    /**
     * Username for login (SRS Section 2.3)
     */
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    /**
     * Email for communication and e-receipt delivery (SRS Section 4.3)
     */
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    /**
     * BCrypt hashed password (SRS Section 9.2 - Security)
     */
    @Column(nullable = false, length = 255)
    private String password;

    /**
     * Optional 4-6 digit PIN for quick POS login (SRS Table 6.1.1)
     * Commonly used by cashiers/waiters for fast authentication
     */
    @Column(length = 6)
    private String pin;

    /**
     * Full name of the staff member
     */
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    /**
     * Contact number for internal communication
     */
    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    /**
     * Role-based access control (SRS Section 5.3, FR-SM-01)
     * Defines permissions for Owner, Manager, Cashier, Waiter, Chef
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.WAITER;

    /**
     * Employee ID or staff code for tracking performance (SRS Section 2.4)
     */
    @Column(name = "employee_code", length = 20)
    private String employeeCode;

    /**
     * Account status flags (SRS Section 2.3)
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;

    /**
     * Failed login attempt tracking for security (SRS Section 9.2)
     */
    @Column(name = "failed_login_attempts", nullable = false)
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;


    /**
     * Audit trail timestamps (SRS Section 5.3, FR-SM-02)
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    /**
     * Soft delete for maintaining audit history
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;


    /**
     * Assigned sections for waiters (SRS Section 5.3, FR-SM-02)
     * JSON array storing section IDs: ["Bar", "Patio"]
     */
    @Column(name = "assigned_sections", columnDefinition = "TEXT")
    private String assignedSections;

    /**
     * Additional metadata (language preference, shift timing, etc.)
     */
//    @Column(name = "preferred_language", length = 10)
//    private String preferredLanguage = "en";

    // ============ JPA Lifecycle Callbacks ============

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.userUuid == null) {
            this.userUuid = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ============ UserDetails Implementation ============

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return isActive;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (isLocked && lockedUntil != null) {
            // Auto-unlock if lock period has passed
            if (LocalDateTime.now().isAfter(lockedUntil)) {
                return true;
            }
            return false;
        }
        return !isLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive && deletedAt == null;
    }

    // ============ Business Logic Helpers ============

    /**
     * Increment failed login attempts and lock account if threshold reached
     */
    public void incrementFailedLoginAttempts() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.isLocked = true;
            this.lockedUntil = LocalDateTime.now().plusMinutes(30);
        }
    }

    /**
     * Reset failed login attempts on successful login
     */
    public void resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
        this.isLocked = false;
        this.lockedUntil = null;
    }

    /**
     * Check if user has specific role
     */
    public boolean hasRole(UserRole requiredRole) {
        return this.role == requiredRole;
    }

    /**
     * Check if user has permission level (hierarchical)
     */
    public boolean hasPermissionLevel(UserRole requiredLevel) {
        return this.role.getLevel() >= requiredLevel.getLevel();
    }
}