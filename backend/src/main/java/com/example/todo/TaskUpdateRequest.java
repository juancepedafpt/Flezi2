package com.example.todo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TaskUpdateRequest(@NotBlank(message = "title must not be blank") String title,
                                String description,
                                @NotNull(message = "status is required for full updates") TaskStatus status) { }
