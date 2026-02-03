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

    @Around("execution(* org.foodos..service..*(..)) || execution(* org.foodos..repository..*(..))")
    public Object enableFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        // Prepare session
        Session session = null;
        try {
            session = entityManager.unwrap(Session.class);
        } catch (Exception e) {
            // EntityManager might not be available or not a Hibernate session
        }

        if (session != null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = false;

            if (auth != null && auth.isAuthenticated()) {
                for (GrantedAuthority authority : auth.getAuthorities()) {
                    String role = authority.getAuthority();
                    if (role.equals("ROLE_" + UserRole.ADMIN.name()) ||
                        role.equals("ROLE_" + UserRole.OWNER.name())) { // Adjust roles as necessary
                        isAdmin = true;
                        break;
                    }
                }
            }

            if (isAdmin) {
                if (session.getEnabledFilter("deletedFilter") != null) {
                    session.disableFilter("deletedFilter");
                }
            } else {
                Filter filter = session.enableFilter("deletedFilter");
                filter.setParameter("isDeleted", false);
            }
        }

        return joinPoint.proceed();
    }
}
