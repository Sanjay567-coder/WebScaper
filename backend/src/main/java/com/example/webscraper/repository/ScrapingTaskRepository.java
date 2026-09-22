package com.example.webscraper.repository;

import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScrapingTaskRepository extends JpaRepository<ScrapingTask, Long> {

    List<ScrapingTask> findByStatus(TaskStatus status);

    @Query("SELECT t FROM ScrapingTask t WHERE " +
           "(:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.sourceUrl) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR t.status = :status)")
    Page<ScrapingTask> searchTasks(@Param("search") String search, @Param("status") TaskStatus status, Pageable pageable);

    long countByStatus(TaskStatus status);
}
