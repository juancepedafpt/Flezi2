package com.example.todo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock TaskRepository repository;
    @InjectMocks TaskService service;

    @Test
    void whitespaceTitleIsRejected() {
        var request = new TaskRequest("  ", null, TaskStatus.OPEN);
        var error = assertThrows(ApiException.class, () -> service.create(UUID.randomUUID(), request));
        assertEquals(400, error.status().value());
    }

    @Test
    void anotherOwnerGetsForbidden() {
        UUID owner = UUID.randomUUID();
        Task task = new Task(UUID.randomUUID(), "task", null, TaskStatus.OPEN);
        when(repository.findById(any())).thenReturn(Optional.of(task));
        var error = assertThrows(ApiException.class,
                () -> service.update(owner, UUID.randomUUID(), new TaskUpdateRequest("new", null, TaskStatus.DONE)));
        assertEquals(403, error.status().value());
    }
}
