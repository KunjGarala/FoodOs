package org.foodos.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.analytics.dto.DashboardAnalyticsDto;
import org.foodos.analytics.dto.DashboardAnalyticsDto.*;
import org.foodos.order.entity.Order;
import org.foodos.order.entity.enums.OrderStatus;
import org.foodos.order.repository.OrderItemRepository;
import org.foodos.order.repository.OrderRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository     orderRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Build the full dashboard analytics for a restaurant.
     *
     * @param restaurantUuid the restaurant UUID from JWT / path variable
     * @param days           how many days back the revenue chart covers (default 7)
     */
    @Transactional(readOnly = true)
    public DashboardAnalyticsDto getDashboardAnalytics(String restaurantUuid, int days) {

        LocalDate today     = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate chartStart = today.minusDays(days - 1);

        return DashboardAnalyticsDto.builder()
                .today(buildDaySummary(restaurantUuid, today))
                .yesterday(buildDaySummary(restaurantUuid, yesterday))
                .revenueChart(buildRevenueChart(restaurantUuid, chartStart, today))
                .topItems(buildTopItems(restaurantUuid, chartStart, today))
                .hourlyOrders(buildHourlyOrders(restaurantUuid, today))
                .ordersByStatus(buildStatusBreakdown(restaurantUuid, today))
                .build();
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private DaySummary buildDaySummary(String restaurantUuid, LocalDate date) {
        BigDecimal revenue = orZero(
                orderRepository.calculateTotalSalesByRestaurantUuidAndDate(restaurantUuid, date));
        Long count = orderRepository.countOrdersByRestaurantUuidAndDate(restaurantUuid, date);
        BigDecimal avg = orZero(
                orderRepository.calculateAverageOrderValueByRestaurantUuid(restaurantUuid, date));

        return DaySummary.builder()
                .revenue(revenue)
                .orderCount(count)
                .avgOrderValue(avg.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private List<DailyRevenue> buildRevenueChart(String restaurantUuid,
                                                 LocalDate start,
                                                 LocalDate end) {
        List<DailyRevenue> chart = new ArrayList<>();
        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            BigDecimal rev = orZero(
                    orderRepository.calculateTotalSalesByRestaurantUuidAndDate(restaurantUuid, cursor));
            Long cnt = orderRepository.countOrdersByRestaurantUuidAndDate(restaurantUuid, cursor);
            chart.add(DailyRevenue.builder()
                    .date(cursor)
                    .revenue(rev)
                    .orderCount(cnt)
                    .build());
            cursor = cursor.plusDays(1);
        }
        return chart;
    }

    private List<TopItem> buildTopItems(String restaurantUuid, LocalDate start, LocalDate end) {
        // Returns Object[]: [productName (String), quantity (BigDecimal), lineTotal (BigDecimal)]
        List<Object[]> rows = orderItemRepository.findTopSellingItems(
                restaurantUuid, start, end, PageRequest.of(0, 5));

        return rows.stream().map(row -> TopItem.builder()
                        .productName((String) row[0])
                        .quantity(((BigDecimal) row[1]).longValue())
                        .revenue(((BigDecimal) row[2]).setScale(2, RoundingMode.HALF_UP))
                        .build())
                .collect(Collectors.toList());
    }

    private List<HourlyData> buildHourlyOrders(String restaurantUuid, LocalDate date) {
        // Fetch today's orders and group by hour in Java (fast for a single day)
        List<Order> orders = orderRepository.findByRestaurantUuidAndOrderDate(restaurantUuid, date);

        // Initialize all 24 hours with 0
        Map<Integer, Long> hourMap = new LinkedHashMap<>();
        for (int h = 0; h < 24; h++) hourMap.put(h, 0L);

        orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .filter(o -> o.getOrderTime() != null)
                .forEach(o -> {
                    int hour = o.getOrderTime().getHour();
                    hourMap.merge(hour, 1L, Long::sum);
                });

        return hourMap.entrySet().stream()
                .map(e -> HourlyData.builder()
                        .hour(e.getKey())
                        .orderCount(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Long> buildStatusBreakdown(String restaurantUuid, LocalDate date) {
        List<Order> orders = orderRepository.findByRestaurantUuidAndOrderDate(restaurantUuid, date);

        return orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getStatus().name(),
                        Collectors.counting()
                ));
    }

    private BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}