package com.example.webscraper;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.dto.config.ExtractionFieldDto;
import com.example.webscraper.dto.request.CreateTaskRequest;
import com.example.webscraper.dto.response.TaskResponse;
import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.TaskStatus;
import com.example.webscraper.repository.ScrapedRecordRepository;
import com.example.webscraper.repository.ScrapingRunRepository;
import com.example.webscraper.repository.ScrapingTaskRepository;
import com.example.webscraper.service.TaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private ScrapingTaskRepository taskRepository;

    @Mock
    private ScrapedRecordRepository recordRepository;

    @Mock
    private ScrapingRunRepository runRepository;

    private TaskService taskService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, recordRepository, runRepository, objectMapper);
    }

    @Test
    @DisplayName("Should successfully create and serialize a scraping task")
    void testCreateTask() {
        ExtractionConfigDto config = ExtractionConfigDto.builder()
                .itemContainerSelector("div.item")
                .fields(List.of(ExtractionFieldDto.builder().name("name").selector("h2").build()))
                .build();

        CreateTaskRequest request = CreateTaskRequest.builder()
                .name("Test Task")
                .sourceUrl("https://example.com/items")
                .extractionConfig(config)
                .schedule("0 0 * * * *")
                .status(TaskStatus.ACTIVE)
                .timeoutSeconds(15)
                .retryCount(3)
                .build();

        ScrapingTask savedEntity = ScrapingTask.builder()
                .id(1L)
                .name("Test Task")
                .sourceUrl("https://example.com/items")
                .extractionConfig(taskService.serializeConfig(config))
                .schedule("0 0 * * * *")
                .status(TaskStatus.ACTIVE)
                .timeoutSeconds(15)
                .retryCount(3)
                .build();

        when(taskRepository.save(any(ScrapingTask.class))).thenReturn(savedEntity);
        when(recordRepository.countByTaskId(1L)).thenReturn(0L);

        TaskResponse response = taskService.createTask(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Test Task", response.getName());
        assertEquals(TaskStatus.ACTIVE, response.getStatus());
        assertEquals(15, response.getTimeoutSeconds());
        verify(taskRepository, times(1)).save(any(ScrapingTask.class));
    }

    @Test
    @DisplayName("Should retrieve task response with parsed configuration")
    void testGetTaskById() {
        String configJson = "{\"itemContainerSelector\":\"div.item\",\"fields\":[{\"name\":\"title\",\"selector\":\"h1\",\"attribute\":\"text\",\"type\":\"TEXT\",\"required\":false}]}";
        ScrapingTask entity = ScrapingTask.builder()
                .id(10L)
                .name("Sample Scraper")
                .sourceUrl("https://example.org")
                .extractionConfig(configJson)
                .status(TaskStatus.ACTIVE)
                .build();

        when(taskRepository.findById(10L)).thenReturn(Optional.of(entity));
        when(recordRepository.countByTaskId(10L)).thenReturn(50L);

        TaskResponse response = taskService.getTaskById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(50L, response.getTotalRecordsCount());
        assertNotNull(response.getExtractionConfig());
        assertEquals("div.item", response.getExtractionConfig().getItemContainerSelector());
    }
}
