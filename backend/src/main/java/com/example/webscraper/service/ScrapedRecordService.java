package com.example.webscraper.service;

import com.example.webscraper.dto.response.PageResponse;
import com.example.webscraper.dto.response.ScrapedRecordDto;
import com.example.webscraper.entity.ScrapedRecord;
import com.example.webscraper.entity.ScrapingTask;
import com.example.webscraper.exception.ResourceNotFoundException;
import com.example.webscraper.repository.ScrapedRecordRepository;
import com.example.webscraper.repository.ScrapingTaskRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScrapedRecordService {

    private final ScrapedRecordRepository recordRepository;
    private final ScrapingTaskRepository taskRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PageResponse<ScrapedRecordDto> searchRecords(
            Long taskId,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<ScrapedRecord> page = recordRepository.searchRecords(taskId, searchTerm, startDate, endDate, pageable);

        Map<Long, String> taskNameMap = taskRepository.findAll().stream()
                .collect(Collectors.toMap(ScrapingTask::getId, ScrapingTask::getName, (a, b) -> a));

        List<ScrapedRecordDto> dtos = page.getContent().stream()
                .map(r -> mapToDto(r, taskNameMap.getOrDefault(r.getTaskId(), "Task #" + r.getTaskId())))
                .toList();

        return PageResponse.of(page, dtos);
    }

    @Transactional(readOnly = true)
    public ScrapedRecordDto getRecordById(Long id) {
        ScrapedRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ScrapedRecord", "id", id));

        String taskName = taskRepository.findById(record.getTaskId())
                .map(ScrapingTask::getName)
                .orElse("Task #" + record.getTaskId());

        return mapToDto(record, taskName);
    }

    @Transactional
    public void deleteRecord(Long id) {
        if (!recordRepository.existsById(id)) {
            throw new ResourceNotFoundException("ScrapedRecord", "id", id);
        }
        recordRepository.deleteById(id);
    }

    public ScrapedRecordDto mapToDto(ScrapedRecord record, String taskName) {
        Map<String, Object> parsedData = Collections.emptyMap();
        if (record.getDataJson() != null && !record.getDataJson().isBlank()) {
            try {
                parsedData = objectMapper.readValue(record.getDataJson(), new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("Could not parse dataJson for record #{}: {}", record.getId(), e.getMessage());
            }
        }

        return ScrapedRecordDto.builder()
                .id(record.getId())
                .taskId(record.getTaskId())
                .taskName(taskName)
                .sourceUrl(record.getSourceUrl())
                .dataJson(record.getDataJson())
                .parsedData(parsedData)
                .contentHash(record.getContentHash())
                .scrapedAt(record.getScrapedAt())
                .build();
    }
}
