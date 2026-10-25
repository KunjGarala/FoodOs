package org.foodos.common.utils;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("permissionEvaluator")
public class PermissionEvaluatorService {

    public boolean hasPermissionLevel(Authentication authentication , String requiredRole) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserAuthEntity user)) {
            return false;
        }
        try {
            UserRole required = UserRole.valueOf(requiredRole);
            return user.hasPermissionLevel(required);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
