package com.assistant.sla.dto;

import com.assistant.sla.model.Priority;
import com.assistant.sla.model.Status;
import com.assistant.sla.model.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private Priority priority;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime slaDueAt;
    private String assignee;
    private boolean atRisk;
    private boolean breached;

    public static TicketResponse fromEntity(Ticket ticket) {
        LocalDateTime now = LocalDateTime.now();
        boolean isClosedOrResolved = ticket.getStatus() == Status.RESOLVED || ticket.getStatus() == Status.CLOSED;

        boolean breached = !isClosedOrResolved && ticket.getSlaDueAt() != null && ticket.getSlaDueAt().isBefore(now);
        boolean atRisk = !isClosedOrResolved && !breached && ticket.getSlaDueAt() != null
                && ticket.getSlaDueAt().isBefore(now.plusHours(4));

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .slaDueAt(ticket.getSlaDueAt())
                .assignee(ticket.getAssignee())
                .atRisk(atRisk)
                .breached(breached)
                .build();
    }
}