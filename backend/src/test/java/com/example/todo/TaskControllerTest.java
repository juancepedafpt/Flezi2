package com.example.todo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired TaskRepository repository;

    @Test
    void createRejectsWhitespaceTitle() throws Exception {
        mvc.perform(post("/tasks").header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(APPLICATION_JSON).content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingDeleteReturnsNotFound() throws Exception {
        mvc.perform(delete("/tasks/" + UUID.randomUUID()).header("X-User-Id", UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherOwnerUpdateReturnsForbidden() throws Exception {
        UUID owner = UUID.randomUUID();
        Task task = repository.save(new Task(owner, "mine", null, TaskStatus.OPEN));
        mvc.perform(put("/tasks/" + task.getId()).header("X-User-Id", UUID.randomUUID().toString())
                        .contentType(APPLICATION_JSON).content("{\"title\":\"changed\",\"status\":\"done\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void fullPutTogglesStatusOpenAndDone() throws Exception {
        UUID owner = UUID.randomUUID();
        Task task = repository.save(new Task(owner, "toggle", null, TaskStatus.OPEN));

        mvc.perform(put("/tasks/" + task.getId()).header("X-User-Id", owner.toString())
                        .contentType(APPLICATION_JSON).content("{\"title\":\"toggle\",\"status\":\"done\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"));

        mvc.perform(put("/tasks/" + task.getId()).header("X-User-Id", owner.toString())
                        .contentType(APPLICATION_JSON).content("{\"title\":\"toggle\",\"status\":\"open\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("open"));
    }

    @Test
    void statusFilterReturnsOnlyCallerOpenTasks() throws Exception {
        UUID owner = UUID.randomUUID();
        repository.save(new Task(owner, "open task", null, TaskStatus.OPEN));
        repository.save(new Task(owner, "done task", null, TaskStatus.DONE));
        repository.save(new Task(UUID.randomUUID(), "other open", null, TaskStatus.OPEN));

        mvc.perform(get("/tasks?status=open").header("X-User-Id", owner.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("open task"))
                .andExpect(jsonPath("$[0].status").value("open"))
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void otherOwnerDeleteReturnsForbidden() throws Exception {
        UUID owner = UUID.randomUUID();
        Task task = repository.save(new Task(owner, "protected", null, TaskStatus.OPEN));

        mvc.perform(delete("/tasks/" + task.getId()).header("X-User-Id", UUID.randomUUID().toString()))
                .andExpect(status().isForbidden());
    }
}
