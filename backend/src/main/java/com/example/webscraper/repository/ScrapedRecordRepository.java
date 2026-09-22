package com.example.webscraper.repository;

import com.example.webscraper.entity.ScrapedRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ScrapedRecordRepository extends JpaRepository<ScrapedRecord, Long> {

    boolean existsByTaskIdAndContentHash(Long taskId, String contentHash);

    Optional<ScrapedRecord> findByTaskIdAndContentHash(Long taskId, String contentHash);

    long countByTaskId(Long taskId);

    @Query("SELECT r FROM ScrapedRecord r WHERE " +
           "(:taskId IS NULL OR r.taskId = :taskId) AND " +
           "(:search IS NULL OR LOWER(r.dataJson) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.sourceUrl) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:startDate IS NULL OR r.scrapedAt >= :startDate) AND " +
           "(:endDate IS NULL OR r.scrapedAt <= :endDate)")
    Page<ScrapedRecord> searchRecords(
            @Param("taskId") Long taskId,
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
