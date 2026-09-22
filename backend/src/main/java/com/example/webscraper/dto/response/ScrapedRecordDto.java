package com.example.webscraper.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapedRecordDto {
    private Long id;
    private Long taskId;
    private String taskName;
    private String sourceUrl;
    private String dataJson;
    private Map<String, Object> parsedData;
    private String contentHash;
    private LocalDateTime scrapedAt;
}
