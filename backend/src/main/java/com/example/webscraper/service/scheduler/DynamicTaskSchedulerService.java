package com.example.webscraper.service.scheduler;

import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.TaskStatus;
import com.example.webscraper.repository.ScrapingTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicTaskSchedulerService {

    private final ScrapingTaskRepository taskRepository;
    private final ScrapingExecutionService executionService;

    /**
     * Periodically inspects active tasks and triggers scheduled runs when their cron schedule is due.
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 10000)
    public void evaluateScheduledTasks() {
        List<ScrapingTask> activeTasks = taskRepository.findByStatus(TaskStatus.ACTIVE);

        for (ScrapingTask task : activeTasks) {
            String schedule = task.getSchedule();
            if (schedule == null || schedule.isBlank() || "MANUAL".equalsIgnoreCase(schedule.trim())) {
                continue;
            }

            try {
                LocalDateTime now = LocalDateTime.now();
                if (task.getNextRunAt() == null) {
                    CronExpression cron = CronExpression.parse(schedule.trim());
                    task.setNextRunAt(cron.next(now));
                    taskRepository.save(task);
                } else if (now.isAfter(task.getNextRunAt())) {
                    log.info("Task #{} ('{}') schedule is due for execution", task.getId(), task.getName());
                    CompletableFuture.runAsync(() -> executionService.executeTask(task.getId(), false));
                }
            } catch (Exception e) {
                log.error("Error evaluating schedule for task #{}: {}", task.getId(), e.getMessage());
            }
        }
    }
}
