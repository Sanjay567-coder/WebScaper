package com.example.webscraper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@Slf4j
public class WebScraperApplication {

    @Value("${app.timezone:Asia/Kolkata}")
    private String configuredTimezone;

    @PostConstruct
    public void init() {
        String tz = System.getenv("TZ");
        if (tz == null || tz.isBlank()) {
            tz = configuredTimezone;
        }
        TimeZone.setDefault(TimeZone.getTimeZone(tz));
        log.info("Application initialized with default JVM TimeZone: {} (Current time: {})",
                TimeZone.getDefault().getID(), java.time.LocalDateTime.now());
    }

    public static void main(String[] args) {
        SpringApplication.run(WebScraperApplication.class, args);
    }
}
