package com.assistant.sla.config;

import com.assistant.sla.model.Priority;
import com.assistant.sla.model.Status;
import com.assistant.sla.model.Ticket;
import com.assistant.sla.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final TicketRepository ticketRepository;

    @Override
    public void run(String... args) {
        if (ticketRepository.count() == 0) {
            Random random = new Random();
            Priority[] priorities = Priority.values();
            Status[] statuses = Status.values();
            String[] assignees = {"alice@company.com", "bob@company.com", "charlie@company.com", "unassigned"};

            for (int i = 1; i <= 105; i++) {
                // Generate relative SLA due dates: past due (-12h to -1h), at risk (+1h to +4h), or far future (+24h to +72h)
                int hourOffset = random.nextBoolean() ? random.nextInt(5) - 2 : random.nextInt(48);

                Ticket ticket = Ticket.builder()
                        .title("System Alert #" + i + ": " + (i % 2 == 0 ? "Database High Latency" : "API SLA Threshold Exceeded"))
                        .description("Automated operational issue generated for testing SLA breach workflows.")
                        .priority(priorities[random.nextInt(priorities.length)])
                        .status(statuses[random.nextInt(statuses.length)])
                        .slaDueAt(LocalDateTime.now().plusHours(hourOffset))
                        .assignee(assignees[random.nextInt(assignees.length)])
                        .build();

                ticketRepository.save(ticket);
            }
            System.out.println("--> DataSeeder successfully seeded 105 synthetic tickets!");
        }
    }
}