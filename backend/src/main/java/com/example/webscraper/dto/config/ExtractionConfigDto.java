package com.example.webscraper.dto.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionConfigDto {

    // e.g. "article.product_pod", "div.quote", or empty if single-item page
    @Builder.Default
    private String itemContainerSelector = "";

    @NotEmpty(message = "At least one extraction field must be defined")
    @Valid
    @Builder.Default
    private List<ExtractionFieldDto> fields = new ArrayList<>();

    private String paginationSelector;

    @Builder.Default
    private Integer maxPages = 1;

    @Builder.Default
    private Integer delayBetweenRequestsMs = 1000;
}
