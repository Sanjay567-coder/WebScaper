package com.example.webscraper.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "scraped_records", indexes = {
        @Index(name = "idx_scraped_records_task", columnList = "task_id"),
        @Index(name = "idx_scraped_records_hash", columnList = "content_hash"),
        @Index(name = "idx_scraped_records_scraped_at", columnList = "scraped_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrapedRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", insertable = false, updatable = false)
    private ScrapingTask task;

    @Column(name = "source_url", nullable = false, columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "data_json", nullable = false, columnDefinition = "LONGTEXT")
    private String dataJson;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @CreationTimestamp
    @Column(name = "scraped_at", updatable = false)
    private LocalDateTime scrapedAt;
}
