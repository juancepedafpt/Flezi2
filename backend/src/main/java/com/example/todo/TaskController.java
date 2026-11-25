package com.example.todo;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) { this.service = service; }

    @GetMapping
    public List<TaskResponse> list(@RequestHeader("X-User-Id") String userId,
                                   @RequestParam(required = false) String status) {
        return service.list(parseUser(userId), parseStatus(status));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(@RequestHeader("X-User-Id") String userId,
                                               @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(201).body(service.create(parseUser(userId), request));
    }

    @PutMapping("/{id}")
    public TaskResponse update(@RequestHeader("X-User-Id") String userId, @PathVariable UUID id,
                               @Valid @RequestBody TaskUpdateRequest request) {
        return service.update(parseUser(userId), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-User-Id") String userId, @PathVariable UUID id) {
        service.delete(parseUser(userId), id);
        return ResponseEntity.noContent().build();
    }

    private UUID parseUser(String value) {
        try { return UUID.fromString(value); }
        catch (Exception ex) { throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "X-User-Id must be a UUID"); }
    }

    private TaskStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try { return TaskStatus.fromJson(value); }
        catch (IllegalArgumentException ex) {
            throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "status must be open or done");
        }
    }
}
