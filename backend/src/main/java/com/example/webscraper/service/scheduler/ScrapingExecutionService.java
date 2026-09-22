package com.example.webscraper.service.scheduler;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.dto.response.ScrapingRunDto;
import com.example.webscraper.entity.ScrapedRecord;
import com.example.webscraper.entity.ScrapingRun;
import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.RunStatus;
import com.example.webscraper.exception.ResourceNotFoundException;
import com.example.webscraper.repository.ScrapedRecordRepository;
import com.example.webscraper.repository.ScrapingRunRepository;
import com.example.webscraper.repository.ScrapingTaskRepository;
import com.example.webscraper.service.TaskService;
import com.example.webscraper.service.processing.DataProcessorService;
import com.example.webscraper.service.scraper.ScraperEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScrapingExecutionService {

    private final ScrapingTaskRepository taskRepository;
    private final ScrapingRunRepository runRepository;
    private final ScrapedRecordRepository recordRepository;
    private final TaskService taskService;
    private final ScraperEngineService scraperEngineService;
    private final DataProcessorService dataProcessorService;

    private static final DateTimeFormatter LOG_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public ScrapingRunDto executeTask(Long taskId, boolean isManual) {
        ScrapingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("ScrapingTask", "id", taskId));

        log.info("Starting execution for Task ID {} ('{}') - Mode: {}", taskId, task.getName(), isManual ? "MANUAL" : "SCHEDULED");

        StringBuilder logBuilder = new StringBuilder();
        appendLog(logBuilder, "Execution initiated (" + (isManual ? "Manual Run" : "Scheduled Trigger") + ") for task: " + task.getName());
        appendLog(logBuilder, "Target URL: " + task.getSourceUrl());

        ScrapingRun run = ScrapingRun.builder()
                .taskId(taskId)
                .status(RunStatus.RUNNING)
                .recordsFound(0)
                .newRecordsCount(0)
                .duplicateRecordsCount(0)
                .logs(logBuilder.toString())
                .build();
        run = runRepository.save(run);

        LocalDateTime startTime = LocalDateTime.now();
        int maxRetries = task.getRetryCount() != null ? task.getRetryCount() : 2;
        int timeoutSeconds = task.getTimeoutSeconds() != null ? task.getTimeoutSeconds() : 10;
        ExtractionConfigDto config = taskService.deserializeConfig(task.getExtractionConfig());

        List<Map<String, Object>> extractedItems = null;
        String errorMessage = null;
        int attempts = 0;

        while (attempts <= maxRetries && extractedItems == null) {
            attempts++;
            try {
                appendLog(logBuilder, "Attempt " + attempts + " of " + (maxRetries + 1) + ": Connecting to source URL...");
                extractedItems = scraperEngineService.scrapeUrl(task.getSourceUrl(), config, timeoutSeconds);
                appendLog(logBuilder, "HTTP request successful. Extracted " + extractedItems.size() + " raw records from HTML.");
            } catch (Exception e) {
                errorMessage = e.getMessage();
                appendLog(logBuilder, "Attempt " + attempts + " failed: " + e.getMessage());
                if (attempts <= maxRetries) {
                    try {
                        Thread.sleep(1500L * attempts);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        LocalDateTime completedTime = LocalDateTime.now();
        int newCount = 0;
        int dupCount = 0;

        if (extractedItems != null) {
            appendLog(logBuilder, "Processing and deduplicating extracted items...");
            List<ScrapedRecord> recordsToSave = new ArrayList<>();

            for (Map<String, Object> rawItem : extractedItems) {
                Map<String, Object> cleaned = dataProcessorService.cleanRecord(rawItem);
                String json = dataProcessorService.toJsonString(cleaned);
                String hash = dataProcessorService.computeContentHash(json);

                boolean alreadyExists = recordRepository.existsByTaskIdAndContentHash(taskId, hash);
                if (alreadyExists) {
                    dupCount++;
                } else {
                    newCount++;
                    ScrapedRecord record = ScrapedRecord.builder()
                            .taskId(taskId)
                            .sourceUrl(task.getSourceUrl())
                            .dataJson(json)
                            .contentHash(hash)
                            .build();
                    recordsToSave.add(record);
                }
            }

            if (!recordsToSave.isEmpty()) {
                recordRepository.saveAll(recordsToSave);
                appendLog(logBuilder, "Persisted " + recordsToSave.size() + " new records to MySQL.");
            }
            appendLog(logBuilder, "Summary: Found=" + extractedItems.size() + ", New=" + newCount + ", Duplicates=" + dupCount);

            run.setStatus(RunStatus.SUCCESS);
            run.setRecordsFound(extractedItems.size());
            run.setNewRecordsCount(newCount);
            run.setDuplicateRecordsCount(dupCount);
        } else {
            appendLog(logBuilder, "Execution FAILED after " + attempts + " attempts. Error: " + errorMessage);
            run.setStatus(RunStatus.FAILED);
            run.setErrorMessage(errorMessage);
        }

        run.setCompletedAt(completedTime);
        run.setLogs(logBuilder.toString());
        run = runRepository.save(run);

        // Update task lastRunAt and nextRunAt
        task.setLastRunAt(completedTime);
        calculateNextRunTime(task);
        taskRepository.save(task);

        return mapToDto(run, task.getName());
    }

    private void calculateNextRunTime(ScrapingTask task) {
        String schedule = task.getSchedule();
        if (schedule != null && !schedule.isBlank() && !"MANUAL".equalsIgnoreCase(schedule.trim())) {
            try {
                CronExpression cron = CronExpression.parse(schedule.trim());
                LocalDateTime next = cron.next(LocalDateTime.now());
                task.setNextRunAt(next);
            } catch (Exception e) {
                log.warn("Could not parse cron expression '{}' for task ID {}: {}", schedule, task.getId(), e.getMessage());
            }
        }
    }

    private void appendLog(StringBuilder builder, String message) {
        String entry = "[" + LocalDateTime.now().format(LOG_TIME_FMT) + "] " + message + "\n";
        builder.append(entry);
    }

    public ScrapingRunDto mapToDto(ScrapingRun run, String taskName) {
        Long duration = null;
        if (run.getStartedAt() != null && run.getCompletedAt() != null) {
            duration = Duration.between(run.getStartedAt(), run.getCompletedAt()).toMillis();
        }

        return ScrapingRunDto.builder()
                .id(run.getId())
                .taskId(run.getTaskId())
                .taskName(taskName != null ? taskName : "Task #" + run.getTaskId())
                .startedAt(run.getStartedAt())
                .completedAt(run.getCompletedAt())
                .durationMs(duration)
                .status(run.getStatus())
                .recordsFound(run.getRecordsFound())
                .newRecordsCount(run.getNewRecordsCount())
                .duplicateRecordsCount(run.getDuplicateRecordsCount())
                .errorMessage(run.getErrorMessage())
                .logs(run.getLogs())
                .build();
    }
}
