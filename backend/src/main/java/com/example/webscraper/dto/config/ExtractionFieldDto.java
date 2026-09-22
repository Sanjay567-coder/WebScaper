package com.example.webscraper.dto.config;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionFieldDto {

    @NotBlank(message = "Field name is required")
    private String name;

    @NotBlank(message = "CSS selector is required")
    private String selector;

    @Builder.Default
    private String attribute = "text"; // "text", "href", "src", "title", "class", or specific attribute

    @Builder.Default
    private String type = "TEXT"; // "TEXT", "URL", "NUMBER", "ARRAY"

    @Builder.Default
    private boolean required = false;

    private String defaultValue;
}
