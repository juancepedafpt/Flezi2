package com.example.todo;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(UUID id, UUID ownerId, String title, String description,
                           TaskStatus status, Instant createdAt, Instant updatedAt) {
    static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getOwnerId(), task.getTitle(), task.getDescription(),
                task.getStatus(), task.getCreatedAt(), task.getUpdatedAt());
    }
}
