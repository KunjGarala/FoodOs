package org.foodos.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.foodos.auth.entity.UserRole;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class HibernateFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Around("execution(* org.springframework.data.jpa.repository.JpaRepository+.*(..))")
    public Object enableFilter(ProceedingJoinPoint joinPoint) throws Throwable {

        Session session;
        try {
            session = entityManager.unwrap(Session.class);
        } catch (Exception e) {
            return joinPoint.proceed();
        }

        Filter filter = session.getEnabledFilter("deletedFilter");
        boolean wasEnabled = filter != null;

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            boolean isAdmin = auth != null && auth.isAuthenticated()
                    && auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(r ->
                            r.equals("ROLE_" + UserRole.ADMIN.name()) ||
                                    r.equals("ROLE_" + UserRole.OWNER.name())
                    );

            if (isAdmin) {
                session.disableFilter("deletedFilter");
            } else {
                session.enableFilter("deletedFilter")
                        .setParameter("isDeleted", false);
            }

            return joinPoint.proceed();
        }
        finally {
            // restore original state
            if (wasEnabled) {
                session.enableFilter("deletedFilter")
                        .setParameter("isDeleted", false);
            } else {
                session.disableFilter("deletedFilter");
            }
        }
    }

}
