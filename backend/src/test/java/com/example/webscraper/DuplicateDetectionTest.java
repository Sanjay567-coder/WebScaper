package com.example.webscraper;

import com.example.webscraper.service.processing.DataProcessorService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DuplicateDetectionTest {

    private DataProcessorService dataProcessorService;

    @BeforeEach
    void setUp() {
        dataProcessorService = new DataProcessorService(new ObjectMapper());
    }

    @Test
    @DisplayName("Should generate same SHA-256 hash for identical records regardless of initial key ordering")
    void testDeterministicContentHash() {
        Map<String, Object> map1 = new HashMap<>();
        map1.put("title", "Clean Code");
        map1.put("price", "£35.00");
        map1.put("rating", "Five");

        Map<String, Object> map2 = new HashMap<>();
        map2.put("rating", "Five");
        map2.put("price", "£35.00");
        map2.put("title", "Clean Code");

        Map<String, Object> cleaned1 = dataProcessorService.cleanRecord(map1);
        Map<String, Object> cleaned2 = dataProcessorService.cleanRecord(map2);

        String json1 = dataProcessorService.toJsonString(cleaned1);
        String json2 = dataProcessorService.toJsonString(cleaned2);

        String hash1 = dataProcessorService.computeContentHash(json1);
        String hash2 = dataProcessorService.computeContentHash(json2);

        assertNotNull(hash1);
        assertEquals(64, hash1.length(), "SHA-256 hex string should be 64 characters long");
        assertEquals(hash1, hash2, "Content hashes must match for equivalent records");
    }

    @Test
    @DisplayName("Should generate different SHA-256 hashes for distinct records")
    void testDifferentContentHashForDifferentData() {
        Map<String, Object> map1 = Map.of("title", "Clean Code", "price", "£35.00");
        Map<String, Object> map2 = Map.of("title", "Refactoring", "price", "£42.00");

        String hash1 = dataProcessorService.computeContentHash(dataProcessorService.toJsonString(dataProcessorService.cleanRecord(map1)));
        String hash2 = dataProcessorService.computeContentHash(dataProcessorService.toJsonString(dataProcessorService.cleanRecord(map2)));

        assertNotEquals(hash1, hash2, "Different data must produce different hashes");
    }

    @Test
    @DisplayName("Should normalize whitespace in string fields during cleaning")
    void testWhitespaceNormalization() {
        Map<String, Object> raw = Map.of("title", "  Clean   Architecture  \n ");
        Map<String, Object> cleaned = dataProcessorService.cleanRecord(raw);

        assertEquals("Clean Architecture", cleaned.get("title"));
    }
}
