package com.example.todo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<Task> findAllByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, TaskStatus status);
}
