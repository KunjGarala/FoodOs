package org.foodos.restaurant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.auth.repository.UserAuthRepository;
import org.foodos.common.exceptionhandling.exception.BusinessException;
import org.foodos.common.exceptionhandling.exception.ResourceNotFoundException;
import org.foodos.config.websocket.WebSocketEventService;
import org.foodos.order.dto.request.CreateOrderRequest;
import org.foodos.order.dto.response.OrderResponse;
import org.foodos.order.entity.KitchenOrderTicket;
import org.foodos.order.entity.Order;
import org.foodos.order.mapper.OrderMapper;
import org.foodos.order.repository.KitchenOrderTicketRepository;
import org.foodos.order.repository.OrderRepository;
import org.foodos.order.service.OrderService;
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
    private final OrderService orderService;
    private final OrderMapper orderMapper;
    private final OrderRepository orderRepository;
    private final KitchenOrderTicketRepository kitchenOrderTicketRepository;
    private final WebSocketEventService webSocketEventService;

    /**
     * 1️⃣ Create a new table for a restaurant
     */
    @Transactional
    public TableResponseDto createTable(CreateTableRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Creating new table. Request: {}, User: {}", requestDto, currentUser.getUsername());

        // Validate restaurant exists
        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(requestDto.getRestaurantUuid())
                .orElseThrow(() -> {
                    log.error("Restaurant not found with UUID: {}", requestDto.getRestaurantUuid());
                    return new ResourceNotFoundException(
                            "Restaurant not found with UUID: " + requestDto.getRestaurantUuid());
                });

        // Validate table number uniqueness per restaurant
        if (tableRepository.existsByRestaurantAndTableNumberAndIsDeletedFalse(restaurant,
                requestDto.getTableNumber())) {
            log.error("Table number {} already exists in restaurant {}", requestDto.getTableNumber(),
                    restaurant.getId());
            throw new BusinessException(
                    "Table number " + requestDto.getTableNumber() + " already exists in this restaurant");
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

        TableResponseDto responseDto = tableMapper.toResponseDto(savedTable);
        webSocketEventService.broadcastTableUpdate(requestDto.getRestaurantUuid(), responseDto);
        return responseDto;
    }

    /**
     * 2️⃣ Update table details (not status)
     */
    @Transactional
    public TableResponseDto updateTable(String tableUuid, UpdateTableRequestDto requestDto,
            UserAuthEntity currentUser) {
        log.info("Updating table {}. Request: {}, User: {}", tableUuid, requestDto, currentUser.getUsername());

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> {
                    log.error("Table not found with UUID: {}", tableUuid);
                    return new ResourceNotFoundException("Table not found with UUID: " + tableUuid);
                });

        // Capture State before update
        Boolean wasActive = table.getIsActive();

        // Update fields using mapper
        tableMapper.updateTableFromDto(requestDto, table);

        // Validate: Cannot manually activate a table that is merged (must demerge
        // first)
        // If table is merged, was inactive, and is now being activated -> Block it
        if (Boolean.TRUE.equals(table.getIsMerged()) &&
                !Boolean.TRUE.equals(wasActive) &&
                Boolean.TRUE.equals(table.getIsActive())) {
            log.error("Cannot activate a merged table. Table: {}", table.getTableNumber());
            throw new BusinessException("Cannot activate a merged table. Please demerge the table first.");
        }

        RestaurantTable updatedTable = tableRepository.save(table);
        log.info("Table updated successfully. UUID: {}, Number: {}", updatedTable.getTableUuid(),
                updatedTable.getTableNumber());

        TableResponseDto updateResponse = tableMapper.toResponseDto(updatedTable);
        webSocketEventService.broadcastTableUpdate(
                updatedTable.getRestaurant().getRestaurantUuid(), updateResponse);
        return updateResponse;
    }

    /**
     * 3️⃣ Update table status with lifecycle validation
     */
    @Transactional
    public TableStatusResponseDto updateTableStatus(String tableUuid, UpdateTableStatusRequestDto requestDto,
            UserAuthEntity currentUser) {
        log.info("Updating table status. TableUuid: {}, NewStatus: {}, User: {}",
                tableUuid, requestDto.getStatus(), currentUser.getUsername());

        if (requestDto.getStatus() == null) {
            log.error("Status is required in the request");
            throw new BusinessException("Status is required");
        }

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> {
                    log.error("Table not found with UUID: {}", tableUuid);
                    return new ResourceNotFoundException("Table not found with UUID: " + tableUuid);
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

                // Fetch the order entity and set it on the table
                Order order = orderService.getOrderEntityByUuid(requestDto.getCurrentOrderId());
                table.setCurrentOrder(order);
                table.setSeatedAt(LocalDateTime.now());
                table.setCurrentPax(requestDto.getCurrentPax());

                // Set waiter if provided
                if (requestDto.getWaiterUuid() != null && !requestDto.getWaiterUuid().isEmpty()) {
                    UserAuthEntity waiter = userAuthRepository
                            .findByUserUuidAndIsDeletedFalse(requestDto.getWaiterUuid())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Waiter not found with UUID: " + requestDto.getWaiterUuid()));
                    table.setCurrentWaiter(waiter);
                }
                log.info("Table {} marked as OCCUPIED. Order: {}, Waiter: {}",
                        table.getTableNumber(), requestDto.getCurrentOrderId(), requestDto.getWaiterUuid());
                break;

            case VACANT:
                table.clearOrder();
                // Removed auto-demerge logic. Tables must be manually demerged.
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

        log.info("Table status updated successfully. UUID: {}, Status: {} -> {}",
                tableUuid, currentStatus, newStatus);

        TableStatusResponseDto statusResponse = TableStatusResponseDto.builder()
                .tableUuid(updatedTable.getTableUuid())
                .tableNumber(updatedTable.getTableNumber())
                .status(updatedTable.getStatus())
                .currentOrderId(
                        updatedTable.getCurrentOrder() != null ? updatedTable.getCurrentOrder().getOrderUuid() : null)
                .currentPax(updatedTable.getCurrentPax())
                .occupiedSince(updatedTable.getSeatedAt())
                .waiterUuid(
                        updatedTable.getCurrentWaiter() != null ? updatedTable.getCurrentWaiter().getUserUuid() : null)
                .waiterName(
                        updatedTable.getCurrentWaiter() != null ? updatedTable.getCurrentWaiter().getFullName() : null)
                .build();

        // Broadcast table status change via WebSocket
        webSocketEventService.broadcastTableUpdate(
                updatedTable.getRestaurant().getRestaurantUuid(), statusResponse);

        return statusResponse;
    }

    /**
     * 4️⃣ Get table by ID with live status
     */
    @Transactional(readOnly = true)
    public TableResponseDto getTableById(String tableUuid) {
        log.info("Fetching table by UUID: {}", tableUuid);

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> {
                    log.error("Table not found with UUID: {}", tableUuid);
                    return new ResourceNotFoundException("Table not found with UUID: " + tableUuid);
                });

        TableResponseDto response = tableMapper.toResponseDto(table);

        // Add current order details if table is occupied
        if (table.getStatus() == TableStatus.OCCUPIED && table.getSeatedAt() != null
                && table.getCurrentOrder() != null) {
            long elapsedMinutes = Duration.between(table.getSeatedAt(), LocalDateTime.now()).toMinutes();

            // Use stored order entity
            TableResponseDto.CurrentOrderDto orderDto = TableResponseDto.CurrentOrderDto.builder()
                    .orderId(table.getCurrentOrder().getOrderUuid())
                    .elapsedMinutes(elapsedMinutes)
                    .totalAmount(table.getCurrentOrder().getTotalAmount() != null
                            ? table.getCurrentOrder().getTotalAmount().doubleValue()
                            : 0.0)
                    .build();

            response.setCurrentOrder(orderDto);
        }

        log.info("Table fetched successfully. UUID: {}, Number: {}, Status: {}",
                table.getTableUuid(), table.getTableNumber(), table.getStatus());

        return response;
    }

    /**
     * 5️⃣ Get all tables (Admin/Manager) - Paginated
     */
    @Transactional(readOnly = true)
    public Page<TableResponseDto> getAllTables(Pageable pageable, TableStatus status , String restaurantUuid) {
        log.info("Fetching all tables. Page: {}, Size: {}, Status filter: {}",
                pageable.getPageNumber(), pageable.getPageSize(), status);

        Page<RestaurantTable> tablesPage;

        if (status != null) {
            tablesPage = tableRepository.findByIsDeletedFalseAndRestaurantUuidAndStatus(restaurantUuid , status, pageable);
        } else {
            tablesPage = tableRepository.findByIsDeletedFalseAndRestaurantUuid(restaurantUuid , pageable);
        }

        log.info("Fetched {} tables. Total elements: {}, Total pages: {}",
                tablesPage.getNumberOfElements(), tablesPage.getTotalElements(), tablesPage.getTotalPages());

        return tablesPage.map(tableMapper::toResponseDto);
    }

    /**
     * 6️⃣ Get tables by restaurant for floor plan view
     */
    @Transactional(readOnly = true)
    public List<TableFloorPlanDto> getTablesByRestaurant(String restaurantUuid) {
        log.info("Fetching active tables for restaurant UUID: {} (Floor plan view)", restaurantUuid);

        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() -> {
                    log.error("Restaurant not found with UUID: {}", restaurantUuid);
                    return new ResourceNotFoundException("Restaurant not found with UUID: " + restaurantUuid);
                });

        List<RestaurantTable> tables = tableRepository.findByRestaurantUuidForFloorPlan(restaurantUuid);

        log.info("Fetched {} active tables for restaurant {}", tables.size(), restaurant.getName());

        return tables.stream()
                .map(tableMapper::toFloorPlanDto)
                .toList();
    }

    /**
     * 7️⃣ Get tables by restaurant chain (franchise) - Multi-outlet summary
     */
    @Transactional(readOnly = true)
    public List<RestaurantChainTablesSummaryDto> getTablesByRestaurantChain(String parentRestaurantUuid) {
        log.info("Fetching tables summary for restaurant chain. Parent UUID: {}", parentRestaurantUuid);

        Restaurant parentRestaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(parentRestaurantUuid)
                .orElseThrow(() -> {
                    log.error("Parent restaurant not found with UUID: {}", parentRestaurantUuid);
                    return new ResourceNotFoundException(
                            "Parent restaurant not found with UUID: " + parentRestaurantUuid);
                });

        if (!parentRestaurant.isParentRestaurant()) {
            log.error("Restaurant {} is not a parent restaurant", parentRestaurantUuid);
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
     * 8️⃣ Delete table (permanent delete)
     */
    @Transactional
    public void deleteTable(String tableUuid, UserAuthEntity currentUser) {
        log.info("Deleting table {}. User: {}", tableUuid, currentUser.getUsername());

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> {
                    log.error("Table not found with UUID: {}", tableUuid);
                    return new ResourceNotFoundException("Table not found with UUID: " + tableUuid);
                });

        // Cannot delete if occupied
        if (table.getStatus() == TableStatus.OCCUPIED) {
            log.error("Cannot delete occupied table. Table: {}, Status: {}", tableUuid, table.getStatus());
            throw new BusinessException("Cannot delete table while it is OCCUPIED");
        }

        // Permanent delete
        String restaurantUuid = table.getRestaurant().getRestaurantUuid();
        tableRepository.delete(table);

        log.info("Table permanently deleted. UUID: {}, Number: {}", tableUuid, table.getTableNumber());
        // Broadcast deletion so frontend can remove the table from the grid
        java.util.Map<String, Object> deletePayload = java.util.Map.of(
                "tableUuid", tableUuid, "deleted", true);
        webSocketEventService.broadcastTableUpdate(restaurantUuid, deletePayload);
    }

    /**
     * 9️⃣ Merge tables for large party
     */
    @Transactional
    public MergeTablesResponseDto mergeTables(MergeTablesRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Merging tables. Parent: {}, Children: {}, User: {}",
                requestDto.getParentTableUuid(), requestDto.getChildTableUuids(), currentUser.getUsername());

        // Fetch parent table
        RestaurantTable parentTable = tableRepository.findByTableUuidAndIsDeletedFalse(requestDto.getParentTableUuid())
                .orElseThrow(() -> {
                    log.error("Parent table not found with UUID: {}", requestDto.getParentTableUuid());
                    return new ResourceNotFoundException("Parent table not found");
                });

        // Fetch child tables
        List<RestaurantTable> childTables = tableRepository
                .findAllByTableUuidInAndIsDeletedFalse(requestDto.getChildTableUuids());

        if (childTables.size() != requestDto.getChildTableUuids().size()) {
            log.error("Some child tables not found. Expected: {}, Found: {}",
                    requestDto.getChildTableUuids().size(), childTables.size());
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

        // Merge logic - store UUIDs instead of IDs
        String mergedUuids = childTables.stream()
                .map(RestaurantTable::getTableUuid)
                .collect(Collectors.joining(","));

        parentTable.setIsMerged(true);
        parentTable.setMergedWithTableIds(mergedUuids);
        parentTable.setCapacity(allTables.stream().mapToInt(RestaurantTable::getCapacity).sum());
        parentTable.setStatus(TableStatus.OCCUPIED);

        // Create an empty order for the merged table
        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .restaurantUuid(parentTable.getRestaurant().getRestaurantUuid())
                .tableUuid(parentTable.getTableUuid())
                .orderType(org.foodos.order.entity.enums.OrderType.DINE_IN)
                .numberOfGuests(parentTable.getCapacity()) // Default to full capacity or 1
                .items(new ArrayList<>())
                .build();

        Order order = orderService.createEmptyOrder(orderRequest, currentUser.getId());
        parentTable.setCurrentOrder(order);

        parentTable.setSeatedAt(LocalDateTime.now());

        // Mark child tables as merged
        for (RestaurantTable childTable : childTables) {
            if (childTable.getTableUuid().equals(parentTable.getTableUuid())) {
                continue; // Skip parent table
            }
            childTable.setIsMerged(true);
            childTable.setMergedWithTableIds(parentTable.getTableUuid());
            childTable.setIsActive(false); // Temporarily inactive
        }

        tableRepository.save(parentTable);
        tableRepository.saveAll(childTables);

        List<String> mergedTableNumbers = childTables.stream()
                .map(RestaurantTable::getTableNumber)
                .toList();

        log.info("Tables merged successfully. Parent: {}, Children: {}, Total capacity: {}",
                parentTable.getTableNumber(), mergedTableNumbers, parentTable.getCapacity());

        MergeTablesResponseDto mergeResponse = MergeTablesResponseDto.builder()
                .mergedTableUuid(parentTable.getTableUuid())
                .mergedTableNumber(parentTable.getTableNumber())
                .mergedTables(mergedTableNumbers)
                .totalCapacity(parentTable.getCapacity())
                .status(parentTable.getStatus())
                .mergedAt(LocalDateTime.now())
                .build();

        // Broadcast merge event – frontend should refresh all tables
        webSocketEventService.broadcastTableUpdate(
                parentTable.getRestaurant().getRestaurantUuid(), mergeResponse);

        return mergeResponse;
    }

    /**
     * 🔟 Transfer table order
     */
    @Transactional
    public TransferTableResponseDto transferTable(TransferTableRequestDto requestDto, UserAuthEntity currentUser) {
        log.info("Transferring table. From: {}, To: {}, User: {}",
                requestDto.getFromTableUuid(), requestDto.getToTableUuid(), currentUser.getUsername());

        RestaurantTable fromTable = tableRepository.findByTableUuidAndIsDeletedFalse(requestDto.getFromTableUuid())
                .orElseThrow(() -> {
                    log.error("Source table not found with UUID: {}", requestDto.getFromTableUuid());
                    return new ResourceNotFoundException("Source table not found");
                });

        RestaurantTable toTable = tableRepository.findByTableUuidAndIsDeletedFalse(requestDto.getToTableUuid())
                .orElseThrow(() -> {
                    log.error("Destination table not found with UUID: {}", requestDto.getToTableUuid());
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

        // Transfer logic - capture all state from source BEFORE clearing
        Order currentOrder = fromTable.getCurrentOrder();
        LocalDateTime seatedAt = fromTable.getSeatedAt();
        Integer currentPax = fromTable.getCurrentPax();
        UserAuthEntity currentWaiter = fromTable.getCurrentWaiter();

        // Fallback: if currentOrder was not set on the table (legacy data),
        // look up the active order by table UUID from the orders table.
        if (currentOrder == null) {
            log.warn("currentOrder is null on source table {}. Attempting fallback lookup via order repository.",
                    fromTable.getTableUuid());
            currentOrder = orderRepository.findActiveOrderByTableUuid(
                    fromTable.getTableUuid(),
                    List.of(org.foodos.order.entity.enums.OrderStatus.COMPLETED,
                            org.foodos.order.entity.enums.OrderStatus.CANCELLED,
                            org.foodos.order.entity.enums.OrderStatus.VOID)
            ).orElse(null);
        }

        if (currentOrder == null) {
            log.error("No active order found for source table {}", fromTable.getTableUuid());
            throw new BusinessException("Source table has no active order to transfer");
        }

        Long orderId = currentOrder.getId();
        String orderUuid = currentOrder.getOrderUuid();

        // Step 1: Clear source table FIRST to avoid unique constraint violation
        // on current_order_id (both tables can't reference the same order simultaneously)
        fromTable.setCurrentOrder(null);
        fromTable.setCurrentPax(null);
        fromTable.setSeatedAt(null);
        fromTable.setCurrentWaiter(null);
        fromTable.setStatus(TableStatus.VACANT);
        tableRepository.saveAndFlush(fromTable);

        // Step 2: Re-load the Order FRESH from DB to avoid Hibernate lazy proxy issues.
        // The proxy obtained via fromTable.getCurrentOrder() can become stale after
        // clearing and flushing the source table.
        Order orderToTransfer = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found during transfer: " + orderUuid));

        // Update the order's table reference to the destination table
        orderToTransfer.setTable(toTable);
        orderRepository.saveAndFlush(orderToTransfer);
        log.info("Order {} table_id updated to destination table {}", orderUuid, toTable.getTableNumber());

        // Step 3: Set up destination table with transferred state
        toTable.setStatus(TableStatus.OCCUPIED);
        toTable.setCurrentOrder(orderToTransfer);
        toTable.setSeatedAt(seatedAt != null ? seatedAt : LocalDateTime.now());
        toTable.setCurrentPax(currentPax);
        toTable.setCurrentWaiter(currentWaiter);
        tableRepository.saveAndFlush(toTable);
        log.info("Table transfer completed successfully. From: {} -> To: {}, Order: {}",
                fromTable.getTableNumber(), toTable.getTableNumber(), orderUuid);

        // Step 4: Update table number on all KOTs belonging to this order
        // KOTs store a denormalized tableNumber; update it to the new destination table.
        List<KitchenOrderTicket> orderKots = kitchenOrderTicketRepository.findByOrderId(orderId);
        if (!orderKots.isEmpty()) {
            String newTableNumber = toTable.getTableNumber();
            for (KitchenOrderTicket kot : orderKots) {
                kot.setTableNumber(newTableNumber);
            }
            kitchenOrderTicketRepository.saveAll(orderKots);
            log.info("Updated tableNumber to '{}' on {} KOT(s) for order {}",
                    newTableNumber, orderKots.size(), orderUuid);

            // Broadcast each updated KOT so the kitchen display refreshes in real-time
            String rUuidForKot = fromTable.getRestaurant().getRestaurantUuid();
            for (KitchenOrderTicket kot : orderKots) {
                webSocketEventService.broadcastKitchenUpdate(rUuidForKot, orderMapper.toKotResponse(kot));
            }
        }

        // Build full table DTOs for both source and destination
        TableFloorPlanDto fromTableDto = tableMapper.toFloorPlanDto(fromTable);
        TableFloorPlanDto toTableDto = tableMapper.toFloorPlanDto(toTable);

        TransferTableResponseDto transferResponse = TransferTableResponseDto.builder()
                .orderId(orderUuid)
                .fromTable(fromTable.getTableNumber())
                .toTable(toTable.getTableNumber())
                .fromTableUuid(fromTable.getTableUuid())
                .toTableUuid(toTable.getTableUuid())
                .fromTableData(fromTableDto)
                .toTableData(toTableDto)
                .transferredAt(LocalDateTime.now())
                .build();

        // Broadcast transfer event (contains both tables' full data)
        String rUuid = fromTable.getRestaurant().getRestaurantUuid();
        webSocketEventService.broadcastTableUpdate(rUuid, transferResponse);

        return transferResponse;
    }

    /**
     * 1️⃣1️⃣ Get table analytics (Optional)
     */
    @Transactional(readOnly = true)
    public TableAnalyticsDto getTableAnalytics(String restaurantUuid) {
        log.info("Generating table analytics for restaurant UUID: {}", restaurantUuid);

        Restaurant restaurant = restaurantRepo.findByRestaurantUuidAndIsDeletedFalse(restaurantUuid)
                .orElseThrow(() -> {
                    log.error("Restaurant not found with UUID: {}", restaurantUuid);
                    return new ResourceNotFoundException("Restaurant not found with UUID: " + restaurantUuid);
                });

        List<RestaurantTable> allTables = tableRepository.findAllByRestaurantAndIsDeletedFalse(restaurant);
        // Filter only active tables for analytics
        List<RestaurantTable> activeTables = allTables.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .toList();
        List<RestaurantTable> occupiedTables = tableRepository.findOccupiedTablesByRestaurantUuid(restaurantUuid);

        // Calculate metrics (using only active tables)
        double occupancyRate = activeTables.isEmpty() ? 0.0 : (occupiedTables.size() * 100.0) / activeTables.size();

        // Calculate average turn time for currently occupied tables
        double avgTurnTime = occupiedTables.stream()
                .filter(t -> t.getSeatedAt() != null)
                .mapToLong(t -> Duration.between(t.getSeatedAt(), LocalDateTime.now()).toMinutes())
                .average()
                .orElse(0.0);

        // Find most used table (simplified - in production, use historical data)
        String mostUsedTable = activeTables.stream()
                .filter(t -> t.getStatus() == TableStatus.OCCUPIED)
                .filter(t -> t.getSeatedAt() != null)
                .min(Comparator.comparing(RestaurantTable::getSeatedAt))
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
                TableStatus.BILLED, Set.of(TableStatus.DIRTY, TableStatus.VACANT),
                TableStatus.DIRTY, Set.of(TableStatus.VACANT),
                TableStatus.RESERVED, Set.of(TableStatus.OCCUPIED, TableStatus.VACANT));

        Set<TableStatus> allowedTransitions = validTransitions.getOrDefault(currentStatus, Collections.emptySet());

        if (!allowedTransitions.contains(newStatus)) {
            log.error("Invalid status transition: {} -> {}", currentStatus, newStatus);
            throw new BusinessException(
                    String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
        }
    }

    private RestaurantChainTablesSummaryDto buildRestaurantTableSummary(Restaurant restaurant) {
        Integer totalTables = tableRepository.countByRestaurantUuid(restaurant.getRestaurantUuid());
        Integer occupied = tableRepository.countByRestaurantUuidAndStatus(restaurant.getRestaurantUuid(),
                TableStatus.OCCUPIED);
        Integer vacant = tableRepository.countByRestaurantUuidAndStatus(restaurant.getRestaurantUuid(),
                TableStatus.VACANT);
        Integer billed = tableRepository.countByRestaurantUuidAndStatus(restaurant.getRestaurantUuid(),
                TableStatus.BILLED);
        Integer dirty = tableRepository.countByRestaurantUuidAndStatus(restaurant.getRestaurantUuid(),
                TableStatus.DIRTY);
        Integer reserved = tableRepository.countByRestaurantUuidAndStatus(restaurant.getRestaurantUuid(),
                TableStatus.RESERVED);

        return RestaurantChainTablesSummaryDto.builder()
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

    /**
     * Demerge a table and restore all child tables to their original state
     */
    @Transactional
    public TableResponseDto demergeTableResponse(String tableUuid, UserAuthEntity currentUser) {
        log.info("Demerging table request by user: {}", currentUser.getUsername());

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        if (!Boolean.TRUE.equals(table.getIsMerged())) {
            throw new BusinessException("Table is not merged");
        }

        // Only allow demerging from the parent table
        if (table.getMergedWithTableIds() != null && !table.getMergedWithTableIds().contains(",")) {
            // This check is a bit simplistic, better to check if it has children in a more
            // robust way if needed,
            // but for now, if it's a child (implied by having a single UUID in mergedWith
            // or logic in mergeTables),
            // we might want to restrict.
            // However, the original logic handled both parent and child.
            // Let's stick to the original logic which handles both, but wrap it for API.
        }

        demergeTable(table);

        TableResponseDto demergeResponse = tableMapper.toResponseDto(table);
        webSocketEventService.broadcastTableUpdate(
                table.getRestaurant().getRestaurantUuid(), demergeResponse);
        return demergeResponse;
    }

    private void demergeTable(RestaurantTable table) {
        log.info("Demerging table: {}", table.getTableNumber());

        if (!table.getIsMerged()) {
            log.warn("Table {} is not merged, skipping demerge", table.getTableNumber());
            return;
        }

        // PARENT TABLE CASE
        if (table.getMergedWithTableIds() != null && table.getMergedWithTableIds().contains(",")) {

            String[] childUuids = table.getMergedWithTableIds().split(",");

            List<RestaurantTable> childTables = tableRepository
                    .findAllByTableUuidInAndIsDeletedFalse(Arrays.asList(childUuids));

            int restoredCapacity = 0;

            for (RestaurantTable child : childTables) {
                if (!child.getTableUuid().equals(table.getTableUuid())) {
                    child.setIsMerged(false);
                    child.setMergedWithTableIds(null);
                    child.setIsActive(true);
                    child.setStatus(TableStatus.VACANT);
                    restoredCapacity += child.getCapacity();
                }
            }

            tableRepository.saveAll(childTables);

            // 🔥 Reset parent completely
            table.setIsMerged(false);
            table.setMergedWithTableIds(null);
            table.setIsActive(true);

            // Parent capacity = merged capacity - children capacity
            table.setCapacity(table.getCapacity() - restoredCapacity);

            log.info("Parent table {} demerged successfully", table.getTableNumber());
        }

        // CHILD TABLE CASE
        else if (table.getMergedWithTableIds() != null) {

            String parentUuid = table.getMergedWithTableIds();

            tableRepository.findByTableUuidAndIsDeletedFalse(parentUuid).ifPresent(parent -> {

                List<String> remainingChildren = new ArrayList<>();

                if (parent.getMergedWithTableIds() != null) {
                    remainingChildren = Arrays.stream(parent.getMergedWithTableIds().split(","))
                            .filter(uuid -> !uuid.equals(table.getTableUuid()))
                            .toList();
                }

                parent.setMergedWithTableIds(
                        remainingChildren.isEmpty() ? null : String.join(",", remainingChildren));

                // 🔥 Always subtract child capacity once
                table.setCapacity(table.getCapacity() - parent.getCapacity());

                if (remainingChildren.isEmpty()) {
                    parent.setIsMerged(false);
                    parent.setIsActive(true);
                }

                tableRepository.save(parent);
            });

            // Reset child
            table.setIsMerged(false);
            table.setMergedWithTableIds(null);
            table.setIsActive(true);
            table.setStatus(TableStatus.VACANT);

            log.info("Child table {} demerged successfully", table.getTableNumber());
        }
    }

    @Transactional
    public OrderResponse occupyTable(String tableUuid, OccupyTableRequest request, Long userId) {
        // 1. Fetch table and verify it's vacant
        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        if (table.getStatus() != TableStatus.VACANT) {
            throw new IllegalStateException("Table is not vacant");
        }

        Restaurant restaurant = table.getRestaurant();

        // 2. Create a new order (with no items)
        CreateOrderRequest orderRequest = CreateOrderRequest.builder()
                .restaurantUuid(restaurant.getRestaurantUuid())
                .tableUuid(tableUuid)
                .orderType(request.getOrderType())
                .numberOfGuests(request.getNumberOfGuests())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())
                .items(new ArrayList<>()) // empty items list
                .build();

        // You may need to modify your order creation logic to allow empty items,
        // or create a dedicated method that creates an order without items.
        Order order = orderService.createEmptyOrder(orderRequest, userId);

        // 3. Update table status, link order, and record seated time
        table.setCurrentOrder(order);
        table.setStatus(TableStatus.OCCUPIED);
        table.setSeatedAt(LocalDateTime.now());
        table.setCurrentPax(request.getNumberOfGuests());

        // 4. Assign waiter if provided
        if (request.getWaiterUuid() != null && !request.getWaiterUuid().isEmpty()) {
            UserAuthEntity waiter = userAuthRepository
                    .findByUserUuidAndIsDeletedFalse(request.getWaiterUuid())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Waiter not found with UUID: " + request.getWaiterUuid()));
            table.setCurrentWaiter(waiter);
        }

        tableRepository.save(table);

        // Broadcast table and order updates via WebSocket
        String restaurantUuid = restaurant.getRestaurantUuid();
        webSocketEventService.broadcastTableUpdate(restaurantUuid, tableMapper.toResponseDto(table));
        OrderResponse orderResponse = orderMapper.toOrderResponse(order);
        webSocketEventService.broadcastOrderUpdate(restaurantUuid, orderResponse);

        // 4. Return order response
        return orderResponse;
    }

    /**
     * Assign or reassign a waiter to a table.
     * Only MANAGER, OWNER, ADMIN can call this.
     */
    @Transactional
    public TableResponseDto assignWaiter(String tableUuid, String waiterUuid, UserAuthEntity currentUser) {
        log.info("Assigning waiter {} to table {} by user {}", waiterUuid, tableUuid, currentUser.getUsername());

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> {
                    log.error("Table not found with UUID: {}", tableUuid);
                    return new ResourceNotFoundException("Table not found with UUID: " + tableUuid);
                });

        UserAuthEntity waiter = userAuthRepository.findByUserUuidAndIsDeletedFalse(waiterUuid)
                .orElseThrow(() -> {
                    log.error("Waiter not found with UUID: {}", waiterUuid);
                    return new ResourceNotFoundException("Waiter not found with UUID: " + waiterUuid);
                });

        // Validate the user is actually a waiter (or at least not above manager)
        if (waiter.getRole() == null) {
            throw new BusinessException("User does not have a valid role");
        }

        table.setCurrentWaiter(waiter);
        RestaurantTable updatedTable = tableRepository.save(table);

        log.info("Waiter {} ({}) assigned to table {} successfully",
                waiter.getFullName(), waiterUuid, table.getTableNumber());

        TableResponseDto responseDto = tableMapper.toResponseDto(updatedTable);
        webSocketEventService.broadcastTableUpdate(
                updatedTable.getRestaurant().getRestaurantUuid(), responseDto);
        return responseDto;
    }

    /**
     * Remove waiter assignment from a table.
     */
    @Transactional
    public TableResponseDto removeWaiter(String tableUuid, UserAuthEntity currentUser) {
        log.info("Removing waiter from table {} by user {}", tableUuid, currentUser.getUsername());

        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> {
                    log.error("Table not found with UUID: {}", tableUuid);
                    return new ResourceNotFoundException("Table not found with UUID: " + tableUuid);
                });

        table.setCurrentWaiter(null);
        RestaurantTable updatedTable = tableRepository.save(table);

        log.info("Waiter removed from table {} successfully", table.getTableNumber());

        TableResponseDto responseDto = tableMapper.toResponseDto(updatedTable);
        webSocketEventService.broadcastTableUpdate(
                updatedTable.getRestaurant().getRestaurantUuid(), responseDto);
        return responseDto;
    }

    public TableDetailResponse getTableDetails(String tableUuid) {
        RestaurantTable table = tableRepository.findByTableUuidAndIsDeletedFalse(tableUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with UUID: " + tableUuid));

        TableResponseDto tableResponse = tableMapper.toResponseDto(table);

        OrderResponse activeOrder = null;
        if (table.getStatus() == TableStatus.OCCUPIED || table.getStatus() == TableStatus.BILLED) {
            try {
                activeOrder = orderService.getActiveOrderByTable(tableUuid);
            } catch (Exception e) {
                log.warn("Could not find active order by table UUID query for table {}. " +
                         "Falling back to table's currentOrder entity. Error: {}",
                         tableUuid, e.getMessage());
                // Fallback: use the table's currentOrder relationship directly
                if (table.getCurrentOrder() != null) {
                    activeOrder = orderMapper.toOrderResponse(table.getCurrentOrder());
                }
            }
        }

        return TableDetailResponse.builder()
                .table(tableResponse)
                .activeOrder(activeOrder)
                .build();
    }
}
