package com.example.todo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum TaskStatus {
    OPEN, DONE;

    @JsonValue
    public String jsonValue() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static TaskStatus fromJson(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("status must be open or done");
        }
    }
}
