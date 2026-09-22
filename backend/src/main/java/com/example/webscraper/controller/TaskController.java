package com.example.webscraper.controller;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.dto.request.CreateTaskRequest;
import com.example.webscraper.dto.request.TestScrapeRequest;
import com.example.webscraper.dto.request.UpdateTaskRequest;
import com.example.webscraper.dto.response.*;
import com.example.webscraper.entity.ScrapingRun;
import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.TaskStatus;
import com.example.webscraper.repository.ScrapingRunRepository;
import com.example.webscraper.service.TaskService;
import com.example.webscraper.service.scheduler.ScrapingExecutionService;
import com.example.webscraper.service.scraper.ScraperEngineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final ScraperEngineService scraperEngineService;
    private final ScrapingExecutionService executionService;
    private final ScrapingRunRepository runRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TaskResponse>>> listTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<TaskResponse> response = taskService.getAllTasks(search, status, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        return new ResponseEntity<>(ApiResponse.success("Task created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long id) {
        TaskResponse response = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        TaskResponse response = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate
    ) {
        String statusStr = statusUpdate.get("status");
        TaskStatus status = TaskStatus.valueOf(statusStr.toUpperCase());
        TaskResponse response = taskService.updateTaskStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Task status updated", response));
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<TestScrapeResultDto>> testScrapeAdHoc(@Valid @RequestBody TestScrapeRequest request) {
        TestScrapeResultDto result = scraperEngineService.testScrape(request);
        return ResponseEntity.ok(ApiResponse.success("Test scrape preview completed", result));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<ApiResponse<TestScrapeResultDto>> testScrapeExistingTask(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit
    ) {
        ScrapingTask task = taskService.getTaskEntity(id);
        ExtractionConfigDto config = taskService.deserializeConfig(task.getExtractionConfig());

        TestScrapeRequest request = TestScrapeRequest.builder()
                .sourceUrl(task.getSourceUrl())
                .extractionConfig(config)
                .limit(limit)
                .timeoutSeconds(task.getTimeoutSeconds())
                .build();

        TestScrapeResultDto result = scraperEngineService.testScrape(request);
        return ResponseEntity.ok(ApiResponse.success("Test scrape completed for task " + task.getName(), result));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<ApiResponse<ScrapingRunDto>> runTaskNow(@PathVariable Long id) {
        ScrapingRunDto runResult = executionService.executeTask(id, true);
        return ResponseEntity.ok(ApiResponse.success("Scraping task execution completed", runResult));
    }

    @GetMapping("/{id}/runs")
    public ResponseEntity<ApiResponse<PageResponse<ScrapingRunDto>>> getTaskRuns(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ScrapingTask task = taskService.getTaskEntity(id);
        Pageable pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        Page<ScrapingRun> runsPage = runRepository.findByTaskIdOrderByStartedAtDesc(id, pageable);

        List<ScrapingRunDto> dtos = runsPage.getContent().stream()
                .map(r -> executionService.mapToDto(r, task.getName()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(runsPage, dtos)));
    }
}
