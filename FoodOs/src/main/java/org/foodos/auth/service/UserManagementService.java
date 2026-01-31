package org.foodos.auth.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.common.utils_temp.S3Service;
import org.foodos.auth.dto_temp.Request.ProfileUpdateDTO;
import org.foodos.auth.dto_temp.Request.SignupRequest;
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
import org.springframework.web.multipart.MultipartFile;
import org.foodos.auth.mapper.UserProfileMapper;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserManagementService {

    private final UserAuthRepository userAuthRepository;
    private final RestaurantRepo restaurantRepository;
    private final PasswordEncoder passwordEncoder;
    private final WelcomeEmailService emailService;
    private final S3Service s3Service;
    private final UserProfileMapper userProfileMapper;

    public UserAuthEntity createEmployee(SignupRequest request, UserAuthEntity currentUserParam, MultipartFile image) {
        // 0️⃣ Re-attach currentUser to current transaction to avoid LazyInitializationException
        UserAuthEntity currentUser = userAuthRepository.findById(currentUserParam.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

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
                !restaurant.getOwner().getId().equals(currentUser.getId()) &&
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

        if (image != null && !image.isEmpty()) {
            String profileUrl = s3Service.uploadImage(image, "users/profile");
            user.setProfilePictureUrl(profileUrl);
        }

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

    public UserAuthEntity updateProfile(UserAuthEntity currentUserParam, ProfileUpdateDTO request, MultipartFile image) {
        UserAuthEntity user = userAuthRepository.findById(currentUserParam.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Use Mapper for basic fields
        userProfileMapper.updateUserFromDto(request, user);

        // Handle Primary Restaurant
        if (request.getPrimaryRestaurantId() != null) {
            Restaurant restaurant = restaurantRepository.findById(request.getPrimaryRestaurantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

            // Validate user has access to this restaurant
            if (!user.canAccessRestaurant(restaurant.getId())) {
                 throw new BusinessException("You do not have access to this restaurant");
            }

            user.setPrimaryRestaurant(restaurant);
        }

        if (image != null && !image.isEmpty()) {
            String profileUrl = s3Service.uploadImage(image, "users/profile");
            user.setProfilePictureUrl(profileUrl);
        }

        return userAuthRepository.save(user);
    }
}

