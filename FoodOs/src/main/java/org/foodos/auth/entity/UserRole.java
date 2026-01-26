package org.foodos.auth.entity;

import lombok.Getter;

/**
 * Role-Based Access Control (RBAC) as per SRS Section 2.3
 * Hierarchical permission levels for restaurant staff
 */
@Getter
public enum UserRole {

    ADMIN(120, "Administrator" , new String[]{
            "ALL_PERMISSIONS"
    }),

    /**
     * Owner/Administrator - Full system access (SRS Section 2.3.1)
     */
    OWNER(100, "Owner/Administrator", new String[]{
            "ALL_PERMISSIONS"
    }),

    /**
     * Store Manager - Day-to-day operations management (SRS Section 2.3.2)
     */
    MANAGER(80, "Store Manager", new String[]{
            "MANAGE_ORDERS", "VOID_BILLS", "REFUND", "DISCOUNT_OVERRIDE",
            "MANAGE_INVENTORY", "CREATE_PURCHASE_ORDERS", "MANAGE_STAFF",
            "VIEW_REPORTS", "MANAGE_MENU", "EDIT_PRICES"
    }),

    /**
     * Cashier - Billing and payment processing (SRS Section 2.3.3)
     */
    CASHIER(60, "Cashier", new String[]{
            "CREATE_ORDERS", "BILLING", "PAYMENT_COLLECTION",
            "APPLY_DISCOUNTS", "PRINT_BILLS", "VIEW_SALES"
    }),

    /**
     * Captain/Waiter - Order taking and table management (SRS Section 2.3.4)
     */
    WAITER(40, "Captain/Waiter", new String[]{
            "CREATE_ORDERS", "EDIT_ORDERS", "GENERATE_KOT",
            "TABLE_MANAGEMENT", "VIEW_MENU"
    }),

    /**
     * Kitchen Staff - Order preparation (SRS Section 2.3.5)
     */
    CHEF(20, "Kitchen Staff", new String[]{
            "VIEW_KOT", "UPDATE_ORDER_STATUS", "MARK_READY"
    }),

    /**
     * Limited access role for temporary staff
     */
    GUEST(10, "Guest/Limited Access", new String[]{
            "VIEW_MENU"
    });

    private final int level;
    private final String displayName;
    private final String[] permissions;

    UserRole(int level, String displayName, String[] permissions) {
        this.level = level;
        this.displayName = displayName;
        this.permissions = permissions;
    }

    /**
     * Check if role has specific permission
     */
    public boolean hasPermission(String permission) {
        if (this == OWNER) return true; // Owner has all permissions
        for (String p : permissions) {
            if (p.equals(permission)) return true;
        }
        return false;
    }
}