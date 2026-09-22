package com.example.webscraper.service.scraper;

import com.example.webscraper.dto.config.ExtractionConfigDto;
import com.example.webscraper.dto.config.ExtractionFieldDto;
import com.example.webscraper.dto.request.TestScrapeRequest;
import com.example.webscraper.dto.response.TestScrapeResultDto;
import com.example.webscraper.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@Slf4j
public class ScraperEngineService {

    @Value("${scraper.default-timeout-ms:10000}")
    private int defaultTimeoutMs;

    @Value("${scraper.default-user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}")
    private String defaultUserAgent;

    public TestScrapeResultDto testScrape(TestScrapeRequest request) {
        long startTime = System.currentTimeMillis();
        int timeoutMs = request.getTimeoutSeconds() != null ? request.getTimeoutSeconds() * 1000 : defaultTimeoutMs;
        int limit = (request.getLimit() != null && request.getLimit() > 0) ? request.getLimit() : 5;

        try {
            validateUrl(request.getSourceUrl());

            Connection.Response response = Jsoup.connect(request.getSourceUrl())
                    .userAgent(defaultUserAgent)
                    .timeout(timeoutMs)
                    .followRedirects(true)
                    .ignoreHttpErrors(false)
                    .execute();

            Document doc = response.parse();
            List<Map<String, Object>> extractedItems = extractDataFromDocument(doc, request.getExtractionConfig());

            int totalFound = extractedItems.size();
            List<Map<String, Object>> previewItems = extractedItems.stream().limit(limit).toList();

            long duration = System.currentTimeMillis() - startTime;
            return TestScrapeResultDto.builder()
                    .success(true)
                    .sourceUrl(request.getSourceUrl())
                    .totalItemsFound(totalFound)
                    .previewItems(previewItems)
                    .durationMs(duration)
                    .httpStatusCode(response.statusCode())
                    .build();

        } catch (Exception e) {
            log.error("Test scrape failed for URL {}: {}", request.getSourceUrl(), e.getMessage());
            long duration = System.currentTimeMillis() - startTime;
            return TestScrapeResultDto.builder()
                    .success(false)
                    .sourceUrl(request.getSourceUrl())
                    .totalItemsFound(0)
                    .previewItems(Collections.emptyList())
                    .durationMs(duration)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    public List<Map<String, Object>> scrapeUrl(String url, ExtractionConfigDto config, int timeoutSeconds) throws IOException {
        validateUrl(url);

        int timeoutMs = timeoutSeconds > 0 ? timeoutSeconds * 1000 : defaultTimeoutMs;
        log.info("Fetching and scraping URL: {} with timeout {}ms", url, timeoutMs);

        Document doc = Jsoup.connect(url)
                .userAgent(defaultUserAgent)
                .timeout(timeoutMs)
                .followRedirects(true)
                .get();

        return extractDataFromDocument(doc, config);
    }

    public List<Map<String, Object>> extractDataFromDocument(Document doc, ExtractionConfigDto config) {
        List<Map<String, Object>> results = new ArrayList<>();

        if (config == null || config.getFields() == null || config.getFields().isEmpty()) {
            return results;
        }

        String containerSelector = config.getItemContainerSelector();

        if (containerSelector != null && !containerSelector.trim().isEmpty()) {
            Elements containers = doc.select(containerSelector.trim());
            for (Element container : containers) {
                Map<String, Object> item = extractFieldsFromElement(container, config.getFields(), doc.baseUri());
                if (!item.isEmpty()) {
                    results.add(item);
                }
            }
        } else {
            // Single item page extraction
            Map<String, Object> item = extractFieldsFromElement(doc, config.getFields(), doc.baseUri());
            if (!item.isEmpty()) {
                results.add(item);
            }
        }

        return results;
    }

    private Map<String, Object> extractFieldsFromElement(Element rootElement, List<ExtractionFieldDto> fields, String baseUri) {
        Map<String, Object> item = new LinkedHashMap<>();

        for (ExtractionFieldDto field : fields) {
            String fieldName = field.getName().trim();
            String selector = field.getSelector().trim();
            String attribute = field.getAttribute() != null ? field.getAttribute().trim().toLowerCase() : "text";
            String type = field.getType() != null ? field.getType().trim().toUpperCase() : "TEXT";

            try {
                if ("ARRAY".equals(type)) {
                    Elements elements = rootElement.select(selector);
                    List<String> values = new ArrayList<>();
                    for (Element el : elements) {
                        String val = extractValueFromElement(el, attribute, baseUri);
                        if (val != null && !val.isBlank()) {
                            values.add(val.trim());
                        }
                    }
                    item.put(fieldName, values);
                } else {
                    Element el = rootElement.selectFirst(selector);
                    if (el != null) {
                        String rawValue = extractValueFromElement(el, attribute, baseUri);
                        Object processedValue = formatValue(rawValue, type);
                        item.put(fieldName, processedValue);
                    } else if (field.getDefaultValue() != null) {
                        item.put(fieldName, field.getDefaultValue());
                    } else {
                        item.put(fieldName, null);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed extracting field '{}' using selector '{}': {}", fieldName, selector, e.getMessage());
                item.put(fieldName, field.getDefaultValue());
            }
        }

        return item;
    }

    private String extractValueFromElement(Element element, String attribute, String baseUri) {
        if (element == null) return null;

        return switch (attribute) {
            case "text" -> element.text();
            case "owntext" -> element.ownText();
            case "html" -> element.html();
            case "outerhtml" -> element.outerHtml();
            case "href" -> {
                String absUrl = element.absUrl("href");
                yield !absUrl.isBlank() ? absUrl : element.attr("href");
            }
            case "src" -> {
                String absUrl = element.absUrl("src");
                yield !absUrl.isBlank() ? absUrl : element.attr("src");
            }
            default -> element.attr(attribute);
        };
    }

    private Object formatValue(String rawValue, String type) {
        if (rawValue == null) return null;
        String trimmed = rawValue.trim();

        return switch (type) {
            case "NUMBER" -> {
                try {
                    String cleanNum = trimmed.replaceAll("[^0-9.-]", "");
                    if (cleanNum.contains(".")) {
                        yield Double.parseDouble(cleanNum);
                    } else if (!cleanNum.isEmpty()) {
                        yield Long.parseLong(cleanNum);
                    }
                } catch (NumberFormatException ignored) {}
                yield trimmed;
            }
            default -> trimmed;
        };
    }

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new BadRequestException("URL cannot be empty");
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BadRequestException("Only HTTP and HTTPS URLs are allowed");
        }
    }
}
