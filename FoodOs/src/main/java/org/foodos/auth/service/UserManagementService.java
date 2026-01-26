package org.foodos.auth.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.DTO.Request.SignupRequest;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.emails.WelcomeEmailService;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserManagementService {

    private final UserAuthRepository userAuthRepository;
    private final RestaurantRepo restaurantRepository;
    private final PasswordEncoder passwordEncoder;
    private final WelcomeEmailService emailService;

    public UserAuthEntity createEmployee(SignupRequest request, UserAuthEntity currentUser) {
        // 1️⃣ Validate role creation permissions
        UserRole creatorRole = currentUser.getRole();
        UserRole targetRole = UserRole.valueOf(request.getRole());
        validateRoleCreationPermission(creatorRole, targetRole);

        // 2️⃣ Fetch restaurant
        Restaurant restaurant = restaurantRepository
                .findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        // 3️⃣ Verify creator has access to this restaurant
        if (creatorRole != UserRole.ADMIN &&
                !restaurant.getOwner().equals(currentUser) &&
                !currentUser.canAccessRestaurant(restaurant.getId())) {
            throw new BusinessException("You cannot create users for this restaurant");
        }

        // 4️⃣ Check for duplicate username/email
        if (userAuthRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already exists");
        }
        if (userAuthRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already exists");
        }

        // 5️⃣ Create user entity
        UserAuthEntity user = UserAuthEntity.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(targetRole)
                .employeeCode(request.getEmployeeCode())
                .pin(request.getPin())
                .isActive(true)
                .createdByUser(currentUser) // Track who created this user
                .build();

        // 6️⃣ Establish bidirectional relationship
        user.addRestaurant(restaurant); // This sets both sides of the relationship

        // 7️⃣ Save user
        UserAuthEntity savedUser = userAuthRepository.save(user);

        // 8️⃣ Send welcome email asynchronously
        try {
            emailService.sendWelcomeEmail(savedUser, restaurant);
        } catch (Exception e) {
            log.error("Failed to send welcome email to user: {}", savedUser.getEmail(), e);
            // Don't throw exception - email failure shouldn't fail user creation
        }

        log.info("Employee {} created by {} for restaurant {}",
                savedUser.getUsername(), currentUser.getUsername(), restaurant.getName());

        return savedUser;
    }

    /**
     * 🔐 Core RBAC Validation
     */
    private void validateRoleCreationPermission(UserRole creator, UserRole target) {
        if (creator == UserRole.ADMIN) return;

        // OWNER → everything except ADMIN & OWNER
        if (creator == UserRole.OWNER) {
            if (target == UserRole.ADMIN || target == UserRole.OWNER) {
                throw new BusinessException("Owner cannot create this role");
            }
            return;
        }

        // MANAGER → cannot create MANAGER / OWNER / ADMIN
        if (creator == UserRole.MANAGER) {
            if (target == UserRole.MANAGER || target == UserRole.OWNER || target == UserRole.ADMIN) {
                throw new BusinessException("Manager cannot create this role");
            }
            return;
        }

        throw new BusinessException("You are not allowed to create users");
    }
}