package com.example.webscraper.controller;

import com.example.webscraper.dto.response.ApiResponse;
import com.example.webscraper.dto.response.DashboardMetricsDto;
import com.example.webscraper.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardMetricsDto>> getDashboardMetrics() {
        DashboardMetricsDto metrics = dashboardService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
}
