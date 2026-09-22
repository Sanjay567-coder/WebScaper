package com.example.webscraper.service;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.dto.request.CreateTaskRequest;
import com.example.webscraper.dto.request.UpdateTaskRequest;
import com.example.webscraper.dto.response.PageResponse;
import com.example.webscraper.dto.response.TaskResponse;
import com.example.webscraper.entity.ScrapingRun;
import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.TaskStatus;
import com.example.webscraper.exception.BadRequestException;
import com.example.webscraper.exception.ResourceNotFoundException;
import com.example.webscraper.repository.ScrapedRecordRepository;
import com.example.webscraper.repository.ScrapingRunRepository;
import com.example.webscraper.repository.ScrapingTaskRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final ScrapingTaskRepository taskRepository;
    private final ScrapedRecordRepository recordRepository;
    private final ScrapingRunRepository runRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        log.info("Creating new scraping task: {}", request.getName());

        String configJson = serializeConfig(request.getExtractionConfig());

        ScrapingTask task = ScrapingTask.builder()
                .name(request.getName().trim())
                .sourceUrl(request.getSourceUrl().trim())
                .extractionConfig(configJson)
                .schedule(request.getSchedule() != null && !request.getSchedule().isBlank() ? request.getSchedule().trim() : "MANUAL")
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.ACTIVE)
                .timeoutSeconds(request.getTimeoutSeconds() != null ? request.getTimeoutSeconds() : 10)
                .retryCount(request.getRetryCount() != null ? request.getRetryCount() : 2)
                .build();

        ScrapingTask savedTask = taskRepository.save(task);
        return mapToResponse(savedTask);
    }

    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
        log.info("Updating scraping task with ID: {}", id);

        ScrapingTask task = getTaskEntity(id);

        String configJson = serializeConfig(request.getExtractionConfig());

        task.setName(request.getName().trim());
        task.setSourceUrl(request.getSourceUrl().trim());
        task.setExtractionConfig(configJson);

        if (request.getSchedule() != null) {
            task.setSchedule(request.getSchedule().trim());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getTimeoutSeconds() != null) {
            task.setTimeoutSeconds(request.getTimeoutSeconds());
        }
        if (request.getRetryCount() != null) {
            task.setRetryCount(request.getRetryCount());
        }

        ScrapingTask updatedTask = taskRepository.save(task);
        return mapToResponse(updatedTask);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        ScrapingTask task = getTaskEntity(id);
        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public ScrapingTask getTaskEntity(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ScrapingTask", "id", id));
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> getAllTasks(String search, TaskStatus status, Pageable pageable) {
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<ScrapingTask> page = taskRepository.searchTasks(searchTerm, status, pageable);

        List<TaskResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.of(page, responses);
    }

    @Transactional
    public void deleteTask(Long id) {
        log.info("Deleting scraping task with ID: {}", id);
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("ScrapingTask", "id", id);
        }
        taskRepository.deleteById(id);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatus status) {
        log.info("Updating status of task {} to {}", id, status);
        ScrapingTask task = getTaskEntity(id);
        task.setStatus(status);
        ScrapingTask saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    public TaskResponse mapToResponse(ScrapingTask task) {
        ExtractionConfigDto configDto = deserializeConfig(task.getExtractionConfig());
        long recordsCount = recordRepository.countByTaskId(task.getId());

        List<ScrapingRun> recentRuns = runRepository.findByTaskIdOrderByStartedAtDesc(task.getId());
        var lastRunStatus = recentRuns.isEmpty() ? null : recentRuns.get(0).getStatus();

        return TaskResponse.builder()
                .id(task.getId())
                .name(task.getName())
                .sourceUrl(task.getSourceUrl())
                .extractionConfig(configDto)
                .extractionConfigRaw(task.getExtractionConfig())
                .schedule(task.getSchedule())
                .status(task.getStatus())
                .timeoutSeconds(task.getTimeoutSeconds())
                .retryCount(task.getRetryCount())
                .lastRunAt(task.getLastRunAt())
                .nextRunAt(task.getNextRunAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .totalRecordsCount(recordsCount)
                .lastRunStatus(lastRunStatus)
                .build();
    }

    public String serializeConfig(ExtractionConfigDto config) {
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize extraction config: {}", e.getMessage());
            throw new BadRequestException("Invalid extraction configuration format: " + e.getMessage());
        }
    }

    public ExtractionConfigDto deserializeConfig(String configJson) {
        if (configJson == null || configJson.isBlank()) {
            return new ExtractionConfigDto();
        }
        try {
            return objectMapper.readValue(configJson, ExtractionConfigDto.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize extraction config JSON: {}", e.getMessage());
            return new ExtractionConfigDto();
        }
    }
}
