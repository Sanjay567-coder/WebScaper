package com.example.webscraper.controller;

import com.example.webscraper.dto.response.ApiResponse;
import com.example.webscraper.dto.response.PageResponse;
import com.example.webscraper.dto.response.ScrapedRecordDto;
import com.example.webscraper.service.ScrapedRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class ScrapedRecordController {

    private final ScrapedRecordService recordService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ScrapedRecordDto>>> searchRecords(
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "scrapedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ?
                Sort.by(sortBy).ascending() :
                Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<ScrapedRecordDto> response = recordService.searchRecords(taskId, search, startDate, endDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScrapedRecordDto>> getRecord(@PathVariable Long id) {
        ScrapedRecordDto response = recordService.getRecordById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRecord(@PathVariable Long id) {
        recordService.deleteRecord(id);
        return ResponseEntity.ok(ApiResponse.success("Record deleted successfully", null));
    }
}
