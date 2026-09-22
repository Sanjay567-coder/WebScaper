package com.example.webscraper.entity;

import com.example.webscraper.entity.enums.RunStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "scraping_runs", indexes = {
        @Index(name = "idx_scraping_runs_task", columnList = "task_id"),
        @Index(name = "idx_scraping_runs_status", columnList = "status"),
        @Index(name = "idx_scraping_runs_started_at", columnList = "started_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScrapingRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", insertable = false, updatable = false)
    private ScrapingTask task;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RunStatus status;

    @Column(name = "records_found")
    @Builder.Default
    private Integer recordsFound = 0;

    @Column(name = "new_records_count")
    @Builder.Default
    private Integer newRecordsCount = 0;

    @Column(name = "duplicate_records_count")
    @Builder.Default
    private Integer duplicateRecordsCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "logs", columnDefinition = "LONGTEXT")
    private String logs;
}
