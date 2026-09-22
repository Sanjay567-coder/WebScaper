package com.example.webscraper.dto.request;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestScrapeRequest {

    @NotBlank(message = "Source URL is required")
    @Pattern(regexp = "^(https?://).+", message = "Source URL must be a valid HTTP or HTTPS URL")
    private String sourceUrl;

    @NotNull(message = "Extraction configuration is required")
    @Valid
    private ExtractionConfigDto extractionConfig;

    @Builder.Default
    private Integer limit = 5;

    @Builder.Default
    private Integer timeoutSeconds = 10;
}
