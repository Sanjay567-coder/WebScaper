package com.example.webscraper.service.processing;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataProcessorService {

    private final ObjectMapper objectMapper;

    /**
     * Cleans and normalizes map keys and string values.
     */
    public Map<String, Object> cleanRecord(Map<String, Object> rawItem) {
        Map<String, Object> cleaned = new TreeMap<>(); // Sorted keys for consistent hashing

        for (Map.Entry<String, Object> entry : rawItem.entrySet()) {
            String key = entry.getKey().trim();
            Object value = entry.getValue();

            if (value instanceof String strVal) {
                String cleanVal = strVal.trim().replaceAll("\\s+", " ");
                cleaned.put(key, cleanVal);
            } else {
                cleaned.put(key, value);
            }
        }
        return cleaned;
    }

    /**
     * Serializes a cleaned record to a deterministic JSON string.
     */
    public String toJsonString(Map<String, Object> cleanedItem) {
        try {
            return objectMapper.writeValueAsString(cleanedItem);
        } catch (Exception e) {
            log.error("Failed to serialize cleaned record to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    /**
     * Computes SHA-256 hash for deduplication based on normalized JSON representation.
     */
    public String computeContentHash(String jsonString) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(jsonString.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
