package org.foodos.analytics.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Dashboard Analytics Response DTO
 * Returned by GET /api/v1/analytics/{restaurantUuid}/dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsDto {

    /** Today's high-level summary */
    private DaySummary today;

    /** Yesterday's summary (for % change calculation on the frontend) */
    private DaySummary yesterday;

    /** Daily revenue + order count for the last N days (default 7) */
    private List<DailyRevenue> revenueChart;

    /** Top 5 items by quantity sold (within the chart period) */
    private List<TopItem> topItems;

    /** Order count grouped by hour of day (0–23) for today */
    private List<HourlyData> hourlyOrders;

    /** Order counts grouped by status for today */
    private Map<String, Long> ordersByStatus;

    // ─── Nested types ────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DaySummary {
        private BigDecimal revenue;
        private Long       orderCount;
        private BigDecimal avgOrderValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenue {
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate  date;
        private BigDecimal revenue;
        private Long       orderCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopItem {
        private String     productName;
        private Long       quantity;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyData {
        private int  hour;       // 0–23
        private Long orderCount;
    }
}