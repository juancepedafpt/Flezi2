package com.example.todo;

import jakarta.validation.constraints.NotBlank;

public record TaskRequest(@NotBlank(message = "title must not be blank") String title,
                          String description,
                          TaskStatus status) { }
