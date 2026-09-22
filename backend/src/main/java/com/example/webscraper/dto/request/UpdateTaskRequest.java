package com.example.webscraper.dto.request;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.entity.enums.TaskStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {

    @NotBlank(message = "Task name is required")
    @Size(max = 150, message = "Task name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Source URL is required")
    @Pattern(regexp = "^(https?://).+", message = "Source URL must be a valid HTTP or HTTPS URL")
    private String sourceUrl;

    @NotNull(message = "Extraction configuration is required")
    @Valid
    private ExtractionConfigDto extractionConfig;

    private String schedule;

    private TaskStatus status;

    @Min(value = 1, message = "Timeout must be at least 1 second")
    @Max(value = 60, message = "Timeout cannot exceed 60 seconds")
    private Integer timeoutSeconds;

    @Min(value = 0, message = "Retry count cannot be negative")
    @Max(value = 5, message = "Retry count cannot exceed 5")
    private Integer retryCount;
}
