package com.example.webscraper.dto.response;

import com.example.webscraper.entity.enums.RunStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapingRunDto {
    private Long id;
    private Long taskId;
    private String taskName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationMs;
    private RunStatus status;
    private Integer recordsFound;
    private Integer newRecordsCount;
    private Integer duplicateRecordsCount;
    private String errorMessage;
    private String logs;
}
