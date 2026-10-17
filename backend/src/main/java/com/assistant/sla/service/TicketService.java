package com.assistant.sla.service;

import com.assistant.sla.dto.CreateTicketRequest;
import com.assistant.sla.dto.TicketResponse;
import com.assistant.sla.dto.UpdateStatusRequest;
import com.assistant.sla.model.Priority;
import com.assistant.sla.model.Status;
import com.assistant.sla.model.Ticket;
import com.assistant.sla.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        // Default SLA due date to 24 hours from now if not specified
        LocalDateTime dueAt = request.getSlaDueAt() != null ?
                request.getSlaDueAt() : LocalDateTime.now().plusHours(24);

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(Status.OPEN)
                .slaDueAt(dueAt)
                .assignee(request.getAssignee() != null ? request.getAssignee() : "UNASSIGNED")
                .build();

        Ticket saved = ticketRepository.save(ticket);
        return TicketResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
        return TicketResponse.fromEntity(ticket);
    }

    @Transactional(readOnly = true)
    public Page<TicketResponse> listTickets(Status status, Priority priority, Pageable pageable) {
        if (status != null) {
            return ticketRepository.findByStatus(status, pageable).map(TicketResponse::fromEntity);
        }
        if (priority != null) {
            return ticketRepository.findByPriority(priority, pageable).map(TicketResponse::fromEntity);
        }
        return ticketRepository.findAll(pageable).map(TicketResponse::fromEntity);
    }

    @Transactional
    public TicketResponse updateStatus(Long id, UpdateStatusRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));

        ticket.setStatus(request.getStatus());
        Ticket updated = ticketRepository.save(ticket);
        return TicketResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTicket(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new RuntimeException("Ticket not found with id: " + id);
        }
        ticketRepository.deleteById(id);
    }
    @Transactional(readOnly = true)
    public List<TicketResponse> getAtRiskTickets(int thresholdHours) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusHours(thresholdHours);

        return ticketRepository.findAtRiskTickets(now, threshold)
                .stream()
                .map(TicketResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getBreachedTickets() {
        LocalDateTime now = LocalDateTime.now();
        return ticketRepository.findBreachedTickets(now)
                .stream()
                .map(TicketResponse::fromEntity)
                .toList();
    }
}