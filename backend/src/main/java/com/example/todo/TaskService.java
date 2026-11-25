package com.example.todo;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TaskService {
    private final TaskRepository repository;

    public TaskService(TaskRepository repository) { this.repository = repository; }

    public List<TaskResponse> list(UUID ownerId, TaskStatus status) {
        var tasks = status == null ? repository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
                : repository.findAllByOwnerIdAndStatusOrderByCreatedAtDesc(ownerId, status);
        return tasks.stream().map(TaskResponse::from).toList();
    }

    @Transactional
    public TaskResponse create(UUID ownerId, TaskRequest request) {
        String title = cleanTitle(request.title());
        return TaskResponse.from(repository.save(new Task(ownerId, title, request.description(), request.status())));
    }

    @Transactional
    public TaskResponse update(UUID ownerId, UUID id, TaskUpdateRequest request) {
        Task task = ownedTask(ownerId, id);
        task.update(cleanTitle(request.title()), request.description(), request.status());
        return TaskResponse.from(repository.save(task));
    }

    @Transactional
    public void delete(UUID ownerId, UUID id) {
        Task task = ownedTask(ownerId, id);
        repository.delete(task);
    }

    private Task ownedTask(UUID ownerId, UUID id) {
        Task task = repository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "task not found"));
        if (!task.getOwnerId().equals(ownerId)) throw new ApiException(HttpStatus.FORBIDDEN, "task belongs to another user");
        return task;
    }

    private String cleanTitle(String title) {
        if (title == null || title.trim().isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "title must not be blank");
        return title.trim();
    }
}
