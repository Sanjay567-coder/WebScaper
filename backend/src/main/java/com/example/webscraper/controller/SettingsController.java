package com.example.webscraper.controller;

import com.example.webscraper.dto.response.ApiResponse;
import com.example.webscraper.entity.User;
import com.example.webscraper.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SettingsController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${scraper.default-timeout-ms:10000}")
    private int defaultTimeoutMs;

    @Value("${scraper.default-user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}")
    private String defaultUserAgent;

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("defaultTimeoutSeconds", defaultTimeoutMs / 1000);
        settings.put("defaultUserAgent", defaultUserAgent);
        settings.put("schedulerEnabled", true);
        settings.put("defaultRetryCount", 2);
        settings.put("rateLimitDelayMs", 1000);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @PutMapping("/settings/profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> profileData
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (profileData.containsKey("name") && !profileData.get("name").isBlank()) {
            user.setName(profileData.get("name").trim());
        }
        if (profileData.containsKey("password") && !profileData.get("password").isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(profileData.get("password")));
        }

        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", null));
    }

    @GetMapping("/system/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemHealth() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory() / (1024 * 1024);
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("database", "CONNECTED");
        health.put("usedMemoryMb", usedMemory);
        health.put("totalMemoryMb", totalMemory);
        health.put("maxMemoryMb", maxMemory);
        health.put("uptimeSeconds", uptimeMs / 1000);
        health.put("jvmVersion", System.getProperty("java.version"));
        health.put("osName", System.getProperty("os.name"));

        return ResponseEntity.ok(ApiResponse.success(health));
    }
}
