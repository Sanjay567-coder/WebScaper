package com.example.webscraper.repository;

import com.example.webscraper.entity.ScrapingRun;
import com.example.webscraper.entity.enums.RunStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScrapingRunRepository extends JpaRepository<ScrapingRun, Long> {

    List<ScrapingRun> findByTaskIdOrderByStartedAtDesc(Long taskId);

    Page<ScrapingRun> findByTaskIdOrderByStartedAtDesc(Long taskId, Pageable pageable);

    Page<ScrapingRun> findAllByOrderByStartedAtDesc(Pageable pageable);

    long countByStatus(RunStatus status);

    @Query("SELECT COUNT(r) FROM ScrapingRun r WHERE r.startedAt >= :since")
    long countRunsSince(@Param("since") LocalDateTime since);

    @Query("SELECT r FROM ScrapingRun r WHERE " +
           "(:taskId IS NULL OR r.taskId = :taskId) AND " +
           "(:status IS NULL OR r.status = :status)")
    Page<ScrapingRun> searchRuns(@Param("taskId") Long taskId, @Param("status") RunStatus status, Pageable pageable);
}
