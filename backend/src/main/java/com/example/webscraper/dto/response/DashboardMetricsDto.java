package com.example.webscraper.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDto {
    private long totalTasks;
    private long activeTasks;
    private long pausedTasks;
    private long totalRecords;
    private double successRatePercent;
    private long totalRuns;
    private long failedRuns;
    private long successfulRuns;
    private List<ScrapingRunDto> recentRuns;
    private List<ActivityChartPoint> activityChart;
    private List<TaskDistributionPoint> taskDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityChartPoint {
        private String date; // "YYYY-MM-DD"
        private long recordsCount;
        private long runsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskDistributionPoint {
        private Long taskId;
        private String taskName;
        private long recordCount;
    }
}
