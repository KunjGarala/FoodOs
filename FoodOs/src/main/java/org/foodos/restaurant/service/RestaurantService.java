package org.foodos.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.dto.Response.ProfileResponseDTO;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.entity.UserRole;
import org.foodos.auth.mapper.UserProfileMapper;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.auth.service.MeService;
import org.foodos.common.utils.S3Service;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.analytics.dto.DashboardAnalyticsDto;
import org.foodos.analytics.service.AnalyticsService;
import org.foodos.restaurant.dto.request.UpdateRestaurantRequestDto;
import org.foodos.restaurant.dto.response.HierarchySummaryResponseDto;
import org.foodos.restaurant.dto.response.RestaurantHierarchyResponseDto;
import org.foodos.restaurant.dto.response.RestaurantResponseDto;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.mapper.RestaurantMapper;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.repository.RestaurantTableRepository;
import org.foodos.restaurant.dto.request.CreateRestaurantRequestDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepo restaurantRepo;

    private final RestaurantMapper restaurantMapper;

    private final UserAuthRepository userRepository;

    private final UserProfileMapper profileMapper;

    private final S3Service s3Service;

    private final MeService meService;

    private final AnalyticsService analyticsService;

    private final RestaurantTableRepository tableRepository;

    @Transactional
    public RestaurantResponseDto createParentRestaurant(
            UserAuthEntity currentUser,
            CreateRestaurantRequestDto requestDto,
            MultipartFile image) {

        UserAuthEntity owner =
                userRepository.getReferenceById(currentUser.getId());

        if (!owner.isOwner()) {
            throw new BusinessException("Only owners can create restaurants");
        }

        if (restaurantRepo.existsByOwnerAndIsDeletedFalse(owner)) {
            throw new BusinessException(
                    "Owner already has a restaurant. Use multi-outlet feature.");
        }

        Restaurant restaurant = restaurantMapper.toEntity(requestDto);
        restaurant.setOwner(owner);
        restaurant.setOwnerName(owner.getFullName());

        if (image != null && !image.isEmpty()) {
            String logoUrl = s3Service.uploadImage(image, "restaurants/logo");
            restaurant.setLogoUrl(logoUrl);
        }

        Restaurant savedRestaurant = restaurantRepo.save(restaurant);

        owner.addRestaurant(savedRestaurant); // managed → auto flushed

        // New outlet list → refresh the owner's cached /me/context picker.
        meService.evictContext(currentUser.getUserUuid());

        log.info("Restaurant created with ID: {}", savedRestaurant.getId());
        return restaurantMapper.toResponseDto(savedRestaurant);
    }


    @Transactional
    public RestaurantResponseDto createChildRestaurant(
            String parentRestaurantUuid,
            CreateRestaurantRequestDto requestDto,
            UserAuthEntity requestingUser,
            MultipartFile image
    ) {

        UserAuthEntity owner =
                userRepository.getReferenceById(requestingUser.getId());

        Restaurant parent = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(parentRestaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Parent restaurant not found"));

        if(!parent.isParentRestaurant()) {
            throw new BusinessException("Cannot create outlet for an outlet restaurant");
        }

        if (!parent.getOwner().getId().equals(owner.getId())) {
            throw new BusinessException(
                    "You can only create outlets for your own restaurants");
        }

        Restaurant child = restaurantMapper.toEntity(requestDto);
        child.setOwner(owner);
        child.setOwnerName(owner.getFullName());
        child.setIsActive(true);

        if (image != null && !image.isEmpty()) {
            String logoUrl = s3Service.uploadImage(image, "restaurants/logo");
            child.setLogoUrl(logoUrl);
        }

        parent.addChildRestaurant(child);
        parent.setIsMultiOutlet(true);

        Restaurant savedChild = restaurantRepo.save(child);

        owner.addRestaurant(savedChild);

        // New child outlet → refresh the owner's cached /me/context picker so the
        // outlet appears on the dashboard immediately, without re-login.
        meService.evictContext(requestingUser.getUserUuid());

        log.info("Outlet restaurant created with ID: {}", savedChild.getId());
        return restaurantMapper.toResponseDto(savedChild);
    }


    @Transactional
    public RestaurantResponseDto updateRestaurant(String restaurantUuid, UpdateRestaurantRequestDto requestDto, UserAuthEntity currentUser, MultipartFile image) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        if (!restaurant.getOwner().getId().equals(currentUser.getId()) && !currentUser.hasRole(org.foodos.auth.entity.UserRole.ADMIN)) {
            throw new BusinessException(
                    "You can only update your own restaurants");
        }

        if(requestDto.getLicenseKey() != null && !currentUser.hasRole(org.foodos.auth.entity.UserRole.ADMIN)) {
            throw new BusinessException("Only ADMIN users can update the license key.");
        }


        restaurantMapper.updateRestaurantFromDto(requestDto, restaurant);

        if (image != null && !image.isEmpty()) {
            String logoUrl = s3Service.uploadImage(image, "restaurants/logo");
            restaurant.setLogoUrl(logoUrl);
        }

        log.info("Restaurant updated with ID: {}", restaurant.getId());
        return restaurantMapper.toResponseDto(restaurant);
    }

    public RestaurantHierarchyResponseDto getRestaurantHierarchy(String restaurantUuid) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        return restaurantMapper.toHierarchyResponseDto(restaurant);
    }

    /**
     * Per-outlet live KPIs for the multi-outlet dashboard. The {@code restaurantUuid}
     * may be either the parent (HQ) or any outlet under the same parent — we always
     * roll up from the chain root, so an outlet caller sees the whole group.
     */
    @Transactional(readOnly = true)
    public HierarchySummaryResponseDto getHierarchySummary(String restaurantUuid) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        Restaurant root = restaurant.getRootRestaurant();

        List<Restaurant> outlets = new ArrayList<>();
        outlets.add(root);
        outlets.addAll(root.getAllActiveChildRestaurants());

        LocalDate today = LocalDate.now();
        BigDecimal groupSales = BigDecimal.ZERO;
        long groupCovers = 0L;
        List<HierarchySummaryResponseDto.OutletKpi> outletKpis = new ArrayList<>();

        for (Restaurant outlet : outlets) {
            DashboardAnalyticsDto.DaySummary day =
                    analyticsService.buildDaySummary(outlet.getRestaurantUuid(), today);
            BigDecimal salesToday = day.getRevenue() != null ? day.getRevenue() : BigDecimal.ZERO;
            Long coversToday = day.getCovers() != null ? day.getCovers() : 0L;
            Integer tableCount = tableRepository.countByRestaurantUuid(outlet.getRestaurantUuid());

            groupSales = groupSales.add(salesToday);
            groupCovers += coversToday;

            outletKpis.add(HierarchySummaryResponseDto.OutletKpi.builder()
                    .restaurantUuid(outlet.getRestaurantUuid())
                    .name(outlet.getName())
                    .city(outlet.getCity())
                    .status(Boolean.TRUE.equals(outlet.getIsActive()) ? "ACTIVE" : "INACTIVE")
                    .salesToday(salesToday)
                    .coversToday(coversToday)
                    .tableCount(tableCount != null ? tableCount : 0)
                    .build());
        }

        return HierarchySummaryResponseDto.builder()
                .groupSalesToday(groupSales)
                .groupCoversToday(groupCovers)
                .outletCount(outletKpis.size())
                .outlets(outletKpis)
                .build();
    }

    public void deleteRestaurant(String restaurantUuid, UserAuthEntity currentUser) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        if (!restaurant.getOwner().getId().equals(currentUser.getId()) && !currentUser.hasRole(org.foodos.auth.entity.UserRole.ADMIN)) {
            throw new BusinessException(
                    "You can only delete your own restaurants");
        }

        if(restaurant.isParentRestaurant() && !restaurant.getAllActiveChildRestaurants().isEmpty()) {
            throw new BusinessException("Cannot delete a parent restaurant with existing outlets. Please delete all outlets first.");
        }

        restaurantRepo.delete(restaurant);

        log.info("Restaurant deleted with ID: {}", restaurant.getId());
    }

    public RestaurantResponseDto getRestaurantDetail(String restaurantUuid) {
        Restaurant restaurant = restaurantRepo
                .findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));

        return restaurantMapper.toResponseDto(restaurant);
    }

    @Transactional
    public List<ProfileResponseDTO> getAllEmployeesByRole(
            String role,
            String restaurantUuid,
            UserAuthEntity currentUserParam
    ) {
        // Re-attach currentUser to current transaction to avoid LazyInitializationException
        UserAuthEntity currentUser = userRepository.findById(currentUserParam.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        // 1. Validate and convert role
        UserRole requestedRole;
        try {
            requestedRole = UserRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid role: " + role);
        }

        // 2. Check if user has permission to view this role based on hierarchy
        if (!canViewRole(currentUser, requestedRole)) {
            throw new BusinessException(
                    String.format("You cannot view %s role. Your role level (%s: %d) is lower than requested role (%s: %d)",
                            requestedRole.getDisplayName(),
                            currentUser.getRole().getDisplayName(),
                            currentUser.getRole().getLevel(),
                            requestedRole.getDisplayName(),
                            requestedRole.getLevel()
                    )
            );
        }

        List<UserAuthEntity> employees = switch (currentUser.getRole()) {
            case ADMIN ->
                // ADMIN (120) can view all employees including other ADMINS and OWNERS
                    userRepository.findByRole(requestedRole);
            case OWNER -> {
                // OWNER (100) can view roles up to OWNER level in their restaurants
                // OWNER cannot view ADMIN roles (since ADMIN level = 120 > OWNER level = 100)
                if (requestedRole == UserRole.ADMIN) {
                    throw new BusinessException("OWNER cannot view ADMIN employees");
                }

                yield getOwnerEmployees(requestedRole, restaurantUuid, currentUser);
            }
            case MANAGER -> {
                // MANAGER (80) can view roles up to MANAGER level in their primary restaurant
                if (requestedRole.getLevel() > UserRole.MANAGER.getLevel()) {
                    throw new BusinessException("MANAGER cannot view roles higher than MANAGER");
                }

                yield getManagerEmployees(requestedRole, currentUser);
            }
            case CASHIER, WAITER, CHEF, GUEST ->
                // Lower level roles cannot view employees (don't have MANAGE_STAFF permission)
                    throw new BusinessException(
                            String.format("%s role is not authorized to view employees",
                                    currentUser.getRole().getDisplayName())
                    );
            default -> throw new BusinessException("Unauthorized role");
        };

        // 3. Handle by current user role with hierarchical permissions

        // 4. Filter out current user and inactive users
        return employees.stream()
                .filter(emp -> !emp.getId().equals(currentUser.getId()))
                .filter(emp -> Boolean.TRUE.equals(emp.getIsActive()))
                .map(profileMapper::toProfileDTO)
                .collect(Collectors.toList());
    }

    // Helper method to check if user can view a specific role
    private boolean canViewRole(UserAuthEntity currentUser, UserRole requestedRole) {
        UserRole currentRole = currentUser.getRole();

        // Check if current user has MANAGE_STAFF permission
        if (!hasManageStaffPermission(currentUser)) {
            return false;
        }

        // Check hierarchical level - cannot view roles higher than your own
        return requestedRole.getLevel() <= currentRole.getLevel();
    }

    // Helper method to check if user has MANAGE_STAFF permission
    private boolean hasManageStaffPermission(UserAuthEntity user) {
        UserRole role = user.getRole();

        // OWNER and ADMIN have all permissions
        if (role == UserRole.OWNER || role == UserRole.ADMIN) {
            return true;
        }

        // Check if role has MANAGE_STAFF permission
        return role.hasPermission("MANAGE_STAFF");
    }

    // Helper method for OWNER logic
    private List<UserAuthEntity> getOwnerEmployees(
            UserRole requestedRole,
            String restaurantUuid,
            UserAuthEntity currentUser
    ) {
        if (restaurantUuid != null && !restaurantUuid.isBlank()) {
            // Specific restaurant
            Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                    .orElseThrow(() -> new BusinessException("Restaurant not found: " + restaurantUuid));

            // Verify owner has access to this restaurant
            if (!currentUser.canAccessRestaurant(restaurant.getId())) {
                throw new BusinessException("You don't have access to this restaurant");
            }

            return userRepository.findByRoleAndRestaurants_IdAndIsActiveTrueAndIsDeletedFalse(
                    requestedRole,
                    restaurant.getId()
            );
        } else {
            // All restaurants owned by this owner
            Set<Long> restaurantIds = currentUser.getRestaurants().stream()
                    .map(Restaurant::getId)
                    .collect(Collectors.toSet());

            if (restaurantIds.isEmpty()) {
                return Collections.emptyList();
            }

            return userRepository.findByRoleAndRestaurants_IdInAndIsActiveTrueAndIsDeletedFalse(
                    requestedRole,
                    restaurantIds
            );
        }
    }

    // Helper method for MANAGER logic
    private List<UserAuthEntity> getManagerEmployees(
            UserRole requestedRole,
            UserAuthEntity currentUser
    ) {
        if (currentUser.getPrimaryRestaurant() == null) {
            throw new BusinessException("Manager does not have an assigned restaurant");
        }

        return userRepository.findByRoleAndRestaurants_IdAndIsActiveTrueAndIsDeletedFalse(
                requestedRole,
                currentUser.getPrimaryRestaurant().getId()
        );
    }

}
