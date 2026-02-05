package org.foodos.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.restaurant.dto.request.*;
import org.foodos.restaurant.dto.response.*;
import org.foodos.restaurant.entity.Restaurant;
import org.foodos.restaurant.entity.RestaurantTable;
import org.foodos.restaurant.entity.enums.TableStatus;
import org.foodos.restaurant.mapper.RestaurantTableMapper;
import org.foodos.restaurant.repository.RestaurantRepo;
import org.foodos.restaurant.repository.RestaurantTableRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final RestaurantRepo restaurantRepo;
    private final UserAuthRepository userAuthRepository;
    private final RestaurantTableMapper tableMapper;

    /**
     * 1️⃣ Create a new table for a restaurant
     */
    @Transactional
    public TableResponseDto createTable(CreateTableRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Creating new table. Request: {}, User: {}", requestDto, currentUser.getUsername());

        // Validate restaurant exists
        Restaurant restaurant = restaurantRepo.findById(requestDto.getRestaurantId())
                .orElseThrow(() -> {
                    log.error("Restaurant not found with ID: {}", requestDto.getRestaurantId());
                    return new ResourceNotFoundException("Restaurant not found with ID: " + requestDto.getRestaurantId());
                });

        // Validate table number uniqueness per restaurant
        if (tableRepository.existsByRestaurantAndTableNumberAndIsDeletedFalse(restaurant, requestDto.getTableNumber())) {
            log.error("Table number {} already exists in restaurant {}", requestDto.getTableNumber(), restaurant.getId());
            throw new BusinessException("Table number " + requestDto.getTableNumber() + " already exists in this restaurant");
        }

        // Validate capacity
        if (requestDto.getCapacity() <= 0) {
            log.error("Invalid capacity: {}", requestDto.getCapacity());
            throw new BusinessException("Capacity must be greater than 0");
        }

        // Map DTO to entity
        RestaurantTable table = tableMapper.toEntity(requestDto);
        table.setRestaurant(restaurant);

        if (requestDto.getMinCapacity() != null) {
            table.setMinCapacity(requestDto.getMinCapacity());
        } else {
            table.setMinCapacity(1);
        }

        // Save table
        RestaurantTable savedTable = tableRepository.save(table);
        log.info("Table created successfully. ID: {}, Number: {}, Restaurant: {}",
                savedTable.getId(), savedTable.getTableNumber(), restaurant.getName());

        return tableMapper.toResponseDto(savedTable);
    }

    /**
     * 2️⃣ Update table details (not status)
     */
    @Transactional
    public TableResponseDto updateTable(Long tableId, UpdateTableRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Updating table {}. Request: {}, User: {}", tableId, requestDto, currentUser.getUsername());

        RestaurantTable table = tableRepository.findByIdAndIsDeletedFalse(tableId)
                .orElseThrow(() -> {
                    log.error("Table not found with ID: {}", tableId);
                    return new ResourceNotFoundException("Table not found with ID: " + tableId);
                });

        // Update fields using mapper
        tableMapper.updateTableFromDto(requestDto, table);

        RestaurantTable updatedTable = tableRepository.save(table);
        log.info("Table updated successfully. ID: {}, Number: {}", updatedTable.getId(), updatedTable.getTableNumber());

        return tableMapper.toResponseDto(updatedTable);
    }

    /**
     * 3️⃣ Update table status with lifecycle validation
     */
    @Transactional
    public TableStatusResponseDto updateTableStatus(Long tableId, UpdateTableStatusRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Updating table status. TableId: {}, NewStatus: {}, User: {}",
                tableId, requestDto.getStatus(), currentUser.getUsername());

        RestaurantTable table = tableRepository.findByIdAndIsDeletedFalse(tableId)
                .orElseThrow(() -> {
                    log.error("Table not found with ID: {}", tableId);
                    return new ResourceNotFoundException("Table not found with ID: " + tableId);
                });

        TableStatus currentStatus = table.getStatus();
        TableStatus newStatus = requestDto.getStatus();

        // Validate status transition
        validateStatusTransition(currentStatus, newStatus);

        // Handle status-specific logic
        switch (newStatus) {
            case OCCUPIED:
                if (requestDto.getCurrentOrderId() == null) {
                    log.error("Order ID required when marking table as OCCUPIED");
                    throw new BusinessException("Order ID is required when marking table as OCCUPIED");
                }
                table.setCurrentOrderUuid(requestDto.getCurrentOrderId());
                table.setSeatedAt(LocalDateTime.now());
                table.setCurrentPax(requestDto.getCurrentPax());

                // Set waiter if provided
                if (requestDto.getWaiterId() != null) {
                    UserAuthEntity waiter = userAuthRepository.findById(requestDto.getWaiterId())
                            .orElseThrow(() -> new ResourceNotFoundException("Waiter not found with ID: " + requestDto.getWaiterId()));
                    table.setCurrentWaiter(waiter);
                }
                log.info("Table {} marked as OCCUPIED. Order: {}, Waiter: {}",
                        table.getTableNumber(), requestDto.getCurrentOrderId(), requestDto.getWaiterId());
                break;

            case VACANT:
                table.setCurrentOrderUuid(null);
                table.setSeatedAt(null);
                table.setCurrentPax(null);
                table.setCurrentWaiter(null);
                log.info("Table {} marked as VACANT", table.getTableNumber());
                break;

            case DIRTY:
                log.info("Table {} marked as DIRTY - requires cleaning", table.getTableNumber());
                break;

            case BILLED:
                log.info("Table {} marked as BILLED - payment completed", table.getTableNumber());
                break;

            case RESERVED:
                log.info("Table {} marked as RESERVED", table.getTableNumber());
                break;
        }

        table.setStatus(newStatus);
        RestaurantTable updatedTable = tableRepository.save(table);

        log.info("Table status updated successfully. ID: {}, Status: {} -> {}",
                tableId, currentStatus, newStatus);

        return TableStatusResponseDto.builder()
                .tableId(updatedTable.getId())
                .tableUuid(updatedTable.getTableUuid())
                .tableNumber(updatedTable.getTableNumber())
                .status(updatedTable.getStatus())
                .currentOrderId(requestDto.getCurrentOrderId())
                .occupiedSince(updatedTable.getSeatedAt())
                .waiterId(updatedTable.getCurrentWaiter() != null ? updatedTable.getCurrentWaiter().getId() : null)
                .waiterName(updatedTable.getCurrentWaiter() != null ? updatedTable.getCurrentWaiter().getFullName() : null)
                .build();
    }

    /**
     * 4️⃣ Get table by ID with live status
     */
    @Transactional(readOnly = true)
    public TableResponseDto getTableById(Long tableId) {
        log.info("Fetching table by ID: {}", tableId);

        RestaurantTable table = tableRepository.findByIdAndIsDeletedFalse(tableId)
                .orElseThrow(() -> {
                    log.error("Table not found with ID: {}", tableId);
                    return new ResourceNotFoundException("Table not found with ID: " + tableId);
                });

        TableResponseDto response = tableMapper.toResponseDto(table);

        // Add current order details if table is occupied
        if (table.getStatus() == TableStatus.OCCUPIED && table.getSeatedAt() != null) {
            long elapsedMinutes = Duration.between(table.getSeatedAt(), LocalDateTime.now()).toMinutes();

            // Use stored order UUID (actual order details will be fetched when Order module is implemented)
            TableResponseDto.CurrentOrderDto orderDto = TableResponseDto.CurrentOrderDto.builder()
                    .orderId(table.getCurrentOrderUuid())
                    .elapsedMinutes(elapsedMinutes)
                    .totalAmount(0.0) // Will be replaced with actual amount from Order module
                    .build();

            response.setCurrentOrder(orderDto);
        }

        log.info("Table fetched successfully. ID: {}, Number: {}, Status: {}",
                table.getId(), table.getTableNumber(), table.getStatus());

        return response;
    }

    /**
     * 5️⃣ Get all tables (Admin/Manager) - Paginated
     */
    @Transactional(readOnly = true)
    public Page<TableResponseDto> getAllTables(Pageable pageable, TableStatus status) {
        log.info("Fetching all tables. Page: {}, Size: {}, Status filter: {}",
                pageable.getPageNumber(), pageable.getPageSize(), status);

        Page<RestaurantTable> tablesPage;

        if (status != null) {
            tablesPage = tableRepository.findAllByStatusAndIsDeletedFalse(status, pageable);
        } else {
            tablesPage = tableRepository.findAllByIsDeletedFalse(pageable);
        }

        log.info("Fetched {} tables. Total elements: {}, Total pages: {}",
                tablesPage.getNumberOfElements(), tablesPage.getTotalElements(), tablesPage.getTotalPages());

        return tablesPage.map(tableMapper::toResponseDto);
    }

    /**
     * 6️⃣ Get tables by restaurant for floor plan view
     */
    @Transactional(readOnly = true)
    public List<TableFloorPlanDto> getTablesByRestaurant(Long restaurantId) {
        log.info("Fetching tables for restaurant ID: {} (Floor plan view)", restaurantId);

        Restaurant restaurant = restaurantRepo.findById(restaurantId)
                .orElseThrow(() -> {
                    log.error("Restaurant not found with ID: {}", restaurantId);
                    return new ResourceNotFoundException("Restaurant not found with ID: " + restaurantId);
                });

        List<RestaurantTable> tables = tableRepository.findByRestaurantIdForFloorPlan(restaurantId);

        log.info("Fetched {} tables for restaurant {}", tables.size(), restaurant.getName());

        return tables.stream()
                .map(tableMapper::toFloorPlanDto)
                .collect(Collectors.toList());
    }

    /**
     * 7️⃣ Get tables by restaurant chain (franchise) - Multi-outlet summary
     */
    @Transactional(readOnly = true)
    public List<RestaurantChainTablesSummaryDto> getTablesByRestaurantChain(Long parentRestaurantId) {
        log.info("Fetching tables summary for restaurant chain. Parent ID: {}", parentRestaurantId);

        Restaurant parentRestaurant = restaurantRepo.findById(parentRestaurantId)
                .orElseThrow(() -> {
                    log.error("Parent restaurant not found with ID: {}", parentRestaurantId);
                    return new ResourceNotFoundException("Parent restaurant not found with ID: " + parentRestaurantId);
                });

        if (!parentRestaurant.isParentRestaurant()) {
            log.error("Restaurant {} is not a parent restaurant", parentRestaurantId);
            throw new BusinessException("Restaurant is not a parent restaurant");
        }

        List<Restaurant> childRestaurants = parentRestaurant.getAllActiveChildRestaurants();
        List<RestaurantChainTablesSummaryDto> summaries = new ArrayList<>();

        for (Restaurant restaurant : childRestaurants) {
            RestaurantChainTablesSummaryDto summary = buildRestaurantTableSummary(restaurant);
            summaries.add(summary);
        }

        log.info("Fetched table summaries for {} outlets", summaries.size());

        return summaries;
    }

    /**
     * 8️⃣ Delete table (soft delete)
     */
    @Transactional
    public void deleteTable(Long tableId, UserAuthEntity currentUser) {
        log.info("Deleting table {}. User: {}", tableId, currentUser.getUsername());

        RestaurantTable table = tableRepository.findByIdAndIsDeletedFalse(tableId)
                .orElseThrow(() -> {
                    log.error("Table not found with ID: {}", tableId);
                    return new ResourceNotFoundException("Table not found with ID: " + tableId);
                });

        // Cannot delete if occupied
        if (table.getStatus() == TableStatus.OCCUPIED) {
            log.error("Cannot delete occupied table. Table: {}, Status: {}", tableId, table.getStatus());
            throw new BusinessException("Cannot delete table while it is OCCUPIED");
        }

        // Soft delete
        table.setIsDeleted(true);
        table.setIsActive(false);
        tableRepository.save(table);

        log.info("Table soft-deleted successfully. ID: {}, Number: {}", tableId, table.getTableNumber());
    }

    /**
     * 9️⃣ Merge tables for large party
     */
    @Transactional
    public MergeTablesResponseDto mergeTables(MergeTablesRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Merging tables. Parent: {}, Children: {}, User: {}",
                requestDto.getParentTableId(), requestDto.getChildTableIds(), currentUser.getUsername());

        // Fetch parent table
        RestaurantTable parentTable = tableRepository.findByIdAndIsDeletedFalse(requestDto.getParentTableId())
                .orElseThrow(() -> {
                    log.error("Parent table not found with ID: {}", requestDto.getParentTableId());
                    return new ResourceNotFoundException("Parent table not found");
                });

        // Fetch child tables
        List<RestaurantTable> childTables = tableRepository.findAllByIdInAndIsDeletedFalse(requestDto.getChildTableIds());

        if (childTables.size() != requestDto.getChildTableIds().size()) {
            log.error("Some child tables not found. Expected: {}, Found: {}",
                    requestDto.getChildTableIds().size(), childTables.size());
            throw new ResourceNotFoundException("One or more child tables not found");
        }

        // Validate all tables are from same restaurant
        Long restaurantId = parentTable.getRestaurant().getId();
        boolean allSameRestaurant = childTables.stream()
                .allMatch(t -> t.getRestaurant().getId().equals(restaurantId));

        if (!allSameRestaurant) {
            log.error("Cannot merge tables from different restaurants");
            throw new BusinessException("All tables must be from the same restaurant");
        }

        // Validate all tables are VACANT
        List<RestaurantTable> allTables = new ArrayList<>();
        allTables.add(parentTable);
        allTables.addAll(childTables);

        boolean allVacant = allTables.stream().allMatch(t -> t.getStatus() == TableStatus.VACANT);
        if (!allVacant) {
            log.error("Cannot merge tables. All tables must be VACANT");
            throw new BusinessException("All tables must be VACANT to merge");
        }

        // Merge logic
        String mergedIds = childTables.stream()
                .map(t -> t.getId().toString())
                .collect(Collectors.joining(","));

        parentTable.setIsMerged(true);
        parentTable.setMergedWithTableIds(mergedIds);
        parentTable.setCapacity(allTables.stream().mapToInt(RestaurantTable::getCapacity).sum());
        parentTable.setStatus(TableStatus.OCCUPIED);
        parentTable.setSeatedAt(LocalDateTime.now());

        // Mark child tables as merged
        for (RestaurantTable childTable : childTables) {
            childTable.setIsMerged(true);
            childTable.setMergedWithTableIds(parentTable.getId().toString());
            childTable.setIsActive(false); // Temporarily inactive
        }

        tableRepository.save(parentTable);
        tableRepository.saveAll(childTables);

        List<String> mergedTableNumbers = childTables.stream()
                .map(RestaurantTable::getTableNumber)
                .collect(Collectors.toList());

        log.info("Tables merged successfully. Parent: {}, Children: {}, Total capacity: {}",
                parentTable.getTableNumber(), mergedTableNumbers, parentTable.getCapacity());

        return MergeTablesResponseDto.builder()
                .mergedTableId(parentTable.getId())
                .mergedTableNumber(parentTable.getTableNumber())
                .mergedTables(mergedTableNumbers)
                .totalCapacity(parentTable.getCapacity())
                .status(parentTable.getStatus())
                .mergedAt(LocalDateTime.now())
                .build();
    }

    /**
     * 🔟 Transfer table order
     */
    @Transactional
    public TransferTableResponseDto transferTable(TransferTableRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Transferring table. From: {}, To: {}, User: {}",
                requestDto.getFromTableId(), requestDto.getToTableId(), currentUser.getUsername());

        RestaurantTable fromTable = tableRepository.findByIdAndIsDeletedFalse(requestDto.getFromTableId())
                .orElseThrow(() -> {
                    log.error("Source table not found with ID: {}", requestDto.getFromTableId());
                    return new ResourceNotFoundException("Source table not found");
                });

        RestaurantTable toTable = tableRepository.findByIdAndIsDeletedFalse(requestDto.getToTableId())
                .orElseThrow(() -> {
                    log.error("Destination table not found with ID: {}", requestDto.getToTableId());
                    return new ResourceNotFoundException("Destination table not found");
                });

        // Validate source table is occupied
        if (fromTable.getStatus() != TableStatus.OCCUPIED) {
            log.error("Source table is not OCCUPIED. Status: {}", fromTable.getStatus());
            throw new BusinessException("Source table must be OCCUPIED to transfer");
        }

        // Validate destination table is vacant
        if (toTable.getStatus() != TableStatus.VACANT) {
            log.error("Destination table is not VACANT. Status: {}", toTable.getStatus());
            throw new BusinessException("Destination table must be VACANT");
        }

        // Validate same restaurant
        if (!fromTable.getRestaurant().getId().equals(toTable.getRestaurant().getId())) {
            log.error("Cannot transfer between different restaurants");
            throw new BusinessException("Tables must be in the same restaurant");
        }

        // Transfer logic - move all state from source to destination
        String orderUuid = fromTable.getCurrentOrderUuid();
        toTable.setStatus(TableStatus.OCCUPIED);
        toTable.setCurrentOrderUuid(orderUuid);
        toTable.setSeatedAt(fromTable.getSeatedAt());
        toTable.setCurrentPax(fromTable.getCurrentPax());
        toTable.setCurrentWaiter(fromTable.getCurrentWaiter());

        fromTable.setStatus(TableStatus.VACANT);
        fromTable.setCurrentOrderUuid(null);
        fromTable.setSeatedAt(null);
        fromTable.setCurrentPax(null);
        fromTable.setCurrentWaiter(null);

        tableRepository.save(fromTable);
        tableRepository.save(toTable);

        log.info("Table transfer completed successfully. From: {} -> To: {}, Order: {}",
                fromTable.getTableNumber(), toTable.getTableNumber(), orderUuid);

        return TransferTableResponseDto.builder()
                .orderId(orderUuid)
                .fromTable(fromTable.getTableNumber())
                .toTable(toTable.getTableNumber())
                .fromTableId(fromTable.getId())
                .toTableId(toTable.getId())
                .transferredAt(LocalDateTime.now())
                .build();
    }

    /**
     * 1️⃣1️⃣ Get table analytics (Optional)
     */
    @Transactional(readOnly = true)
    public TableAnalyticsDto getTableAnalytics(Long restaurantId) {
        log.info("Generating table analytics for restaurant ID: {}", restaurantId);

        Restaurant restaurant = restaurantRepo.findById(restaurantId)
                .orElseThrow(() -> {
                    log.error("Restaurant not found with ID: {}", restaurantId);
                    return new ResourceNotFoundException("Restaurant not found with ID: " + restaurantId);
                });

        List<RestaurantTable> allTables = tableRepository.findAllByRestaurantAndIsDeletedFalse(restaurant);
        List<RestaurantTable> occupiedTables = tableRepository.findOccupiedTablesByRestaurant(restaurantId);

        // Calculate metrics
        double occupancyRate = allTables.isEmpty() ? 0.0 :
                (occupiedTables.size() * 100.0) / allTables.size();

        // Calculate average turn time for currently occupied tables
        double avgTurnTime = occupiedTables.stream()
                .filter(t -> t.getSeatedAt() != null)
                .mapToLong(t -> Duration.between(t.getSeatedAt(), LocalDateTime.now()).toMinutes())
                .average()
                .orElse(0.0);

        // Find most used table (simplified - in production, use historical data)
        String mostUsedTable = allTables.stream()
                .filter(t -> t.getStatus() == TableStatus.OCCUPIED)
                .findFirst()
                .map(RestaurantTable::getTableNumber)
                .orElse("N/A");

        log.info("Table analytics generated. Occupancy rate: {}%, Avg turn time: {} min",
                occupancyRate, avgTurnTime);

        return TableAnalyticsDto.builder()
                .averageTurnTimeMinutes(avgTurnTime)
                .occupancyRate(occupancyRate)
                .mostUsedTable(mostUsedTable)
                .totalOrdersToday(occupiedTables.size())
                .peakHour(LocalDateTime.now().getHour())
                .averageGuestsPerTable(calculateAverageGuestsPerTable(occupiedTables))
                .build();
    }

    // ==================== HELPER METHODS ====================

    private void validateStatusTransition(TableStatus currentStatus, TableStatus newStatus) {
        Map<TableStatus, Set<TableStatus>> validTransitions = Map.of(
                TableStatus.VACANT, Set.of(TableStatus.OCCUPIED, TableStatus.RESERVED),
                TableStatus.OCCUPIED, Set.of(TableStatus.BILLED, TableStatus.VACANT),
                TableStatus.BILLED, Set.of(TableStatus.DIRTY),
                TableStatus.DIRTY, Set.of(TableStatus.VACANT),
                TableStatus.RESERVED, Set.of(TableStatus.OCCUPIED, TableStatus.VACANT)
        );

        Set<TableStatus> allowedTransitions = validTransitions.getOrDefault(currentStatus, Collections.emptySet());

        if (!allowedTransitions.contains(newStatus)) {
            log.error("Invalid status transition: {} -> {}", currentStatus, newStatus);
            throw new BusinessException(
                    String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
        }
    }

    private RestaurantChainTablesSummaryDto buildRestaurantTableSummary(Restaurant restaurant) {
        Integer totalTables = tableRepository.countByRestaurantId(restaurant.getId());
        Integer occupied = tableRepository.countByRestaurantIdAndStatus(restaurant.getId(), TableStatus.OCCUPIED);
        Integer vacant = tableRepository.countByRestaurantIdAndStatus(restaurant.getId(), TableStatus.VACANT);
        Integer billed = tableRepository.countByRestaurantIdAndStatus(restaurant.getId(), TableStatus.BILLED);
        Integer dirty = tableRepository.countByRestaurantIdAndStatus(restaurant.getId(), TableStatus.DIRTY);
        Integer reserved = tableRepository.countByRestaurantIdAndStatus(restaurant.getId(), TableStatus.RESERVED);

        return RestaurantChainTablesSummaryDto.builder()
                .restaurantId(restaurant.getId())
                .restaurantUuid(restaurant.getRestaurantUuid())
                .restaurantName(restaurant.getName())
                .totalTables(totalTables)
                .occupied(occupied)
                .vacant(vacant)
                .billed(billed)
                .dirty(dirty)
                .reserved(reserved)
                .build();
    }

    private Double calculateAverageGuestsPerTable(List<RestaurantTable> tables) {
        return tables.stream()
                .filter(t -> t.getCurrentPax() != null && t.getCurrentPax() > 0)
                .mapToInt(RestaurantTable::getCurrentPax)
                .average()
                .orElse(0.0);
    }
}
