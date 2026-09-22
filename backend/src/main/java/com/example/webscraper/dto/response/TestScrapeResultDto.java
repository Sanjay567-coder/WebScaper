package com.example.webscraper.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestScrapeResultDto {
    private boolean success;
    private String sourceUrl;
    private int totalItemsFound;
    private List<Map<String, Object>> previewItems;
    private long durationMs;
    private int httpStatusCode;
    private String errorMessage;
}
