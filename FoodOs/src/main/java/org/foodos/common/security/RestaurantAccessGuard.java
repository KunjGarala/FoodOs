package org.foodos.common.security;

import org.foodos.auth.entity.UserAuthEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Single reusable multi-tenancy check. Call {@link #assertCanAccess(String)} as the first
 * line of any service method that reads or writes outlet-tagged data — the logged-in user
 * must belong to the outlet (see {@link UserAuthEntity#canAccessRestaurantUuid(String)}),
 * otherwise an {@link AccessDeniedException} (HTTP 403) is thrown.
 *
 * <p>The user's accessible outlets are loaded onto the security principal at authentication
 * time, so this guard needs no extra DB round-trip and no open transaction.
 */
@Component
public class RestaurantAccessGuard {

    public void assertCanAccess(String restaurantUuid) {
        UserAuthEntity user = currentUser();
        if (!user.canAccessRestaurantUuid(restaurantUuid)) {
            throw new AccessDeniedException("No access to this outlet");
        }
    }

    private UserAuthEntity currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserAuthEntity user)) {
            throw new AccessDeniedException("Authentication required");
        }
        return user;
    }
}
