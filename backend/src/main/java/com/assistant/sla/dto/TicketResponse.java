package com.assistant.sla.dto;

import com.assistant.sla.model.Priority;
import com.assistant.sla.model.Status;
import com.assistant.sla.model.Ticket;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private Priority priority;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime slaDueAt;
    private String assignee;

    public static TicketResponse fromEntity(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .slaDueAt(ticket.getSlaDueAt())
                .assignee(ticket.getAssignee())
                .build();
    }
}