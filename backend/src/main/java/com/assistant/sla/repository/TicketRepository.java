package com.assistant.sla.repository;

import com.assistant.sla.model.Priority;
import com.assistant.sla.model.Status;
import com.assistant.sla.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Filter tickets by status with pagination
    Page<Ticket> findByStatus(Status status, Pageable pageable);

    // Filter tickets by priority with pagination
    Page<Ticket> findByPriority(Priority priority, Pageable pageable);

    // Used for SLA calculation (Block 3 preview)
    List<Ticket> findByStatusNotAndSlaDueAtBefore(Status status, LocalDateTime now);

    List<Ticket> findByStatusNotAndSlaDueAtBetween(Status status, LocalDateTime start, LocalDateTime end);
}