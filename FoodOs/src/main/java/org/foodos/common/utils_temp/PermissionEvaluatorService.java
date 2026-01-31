package org.foodos.common.utils_temp;

import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("permissionEvaluator")
public class PermissionEvaluatorService {

    public boolean hasPermissionLevel(Authentication authentication , String requiredRole) {
        UserAuthEntity user = (UserAuthEntity) authentication.getPrincipal();
        UserRole required = UserRole.valueOf(requiredRole);
        return user.hasPermissionLevel(required);
    }
}
