package com.example.webscraper.controller;

import com.example.webscraper.dto.response.ApiResponse;
import com.example.webscraper.dto.response.PageResponse;
import com.example.webscraper.dto.response.ScrapingRunDto;
import com.example.webscraper.entity.ScrapingRun;
import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.RunStatus;
import com.example.webscraper.exception.ResourceNotFoundException;
import com.example.webscraper.repository.ScrapingRunRepository;
import com.example.webscraper.repository.ScrapingTaskRepository;
import com.example.webscraper.service.scheduler.ScrapingExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/runs")
@RequiredArgsConstructor
public class RunController {

    private final ScrapingRunRepository runRepository;
    private final ScrapingTaskRepository taskRepository;
    private final ScrapingExecutionService executionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ScrapingRunDto>>> getAllRuns(
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) RunStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        Page<ScrapingRun> runsPage = runRepository.searchRuns(taskId, status, pageable);

        Map<Long, String> taskNameMap = taskRepository.findAll().stream()
                .collect(Collectors.toMap(ScrapingTask::getId, ScrapingTask::getName, (a, b) -> a));

        List<ScrapingRunDto> dtos = runsPage.getContent().stream()
                .map(r -> executionService.mapToDto(r, taskNameMap.getOrDefault(r.getTaskId(), "Task #" + r.getTaskId())))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(runsPage, dtos)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScrapingRunDto>> getRunDetails(@PathVariable Long id) {
        ScrapingRun run = runRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ScrapingRun", "id", id));

        String taskName = taskRepository.findById(run.getTaskId())
                .map(ScrapingTask::getName)
                .orElse("Task #" + run.getTaskId());

        ScrapingRunDto dto = executionService.mapToDto(run, taskName);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
