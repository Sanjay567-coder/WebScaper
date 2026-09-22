package com.example.webscraper.dto.response;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.entity.enums.RunStatus;
import com.example.webscraper.entity.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private String name;
    private String sourceUrl;
    private ExtractionConfigDto extractionConfig;
    private String extractionConfigRaw;
    private String schedule;
    private TaskStatus status;
    private Integer timeoutSeconds;
    private Integer retryCount;
    private LocalDateTime lastRunAt;
    private LocalDateTime nextRunAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long totalRecordsCount;
    private RunStatus lastRunStatus;
}
