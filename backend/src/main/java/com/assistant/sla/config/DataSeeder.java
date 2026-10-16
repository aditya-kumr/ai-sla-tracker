package com.assistant.sla.config;

import com.assistant.sla.model.*;
import com.assistant.sla.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .email("admin@company.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Admin User")
                    .role(Role.ROLE_ADMIN)
                    .build());

            userRepository.save(User.builder()
                    .email("agent@company.com")
                    .password(passwordEncoder.encode("agent123"))
                    .fullName("Agent User")
                    .role(Role.ROLE_AGENT)
                    .build());

            System.out.println("--> DataSeeder successfully created default Admin & Agent users!");
        }

        if (ticketRepository.count() == 0) {
            Random random = new Random();
            Priority[] priorities = Priority.values();
            Status[] statuses = Status.values();
            String[] assignees = {"alice@company.com", "bob@company.com", "charlie@company.com", "unassigned"};

            for (int i = 1; i <= 105; i++) {
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