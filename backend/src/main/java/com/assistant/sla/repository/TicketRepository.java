package com.assistant.sla.repository;

import com.assistant.sla.model.Priority;
import com.assistant.sla.model.Status;
import com.assistant.sla.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByStatus(Status status, Pageable pageable);

    Page<Ticket> findByPriority(Priority priority, Pageable pageable);

    // Fetch active tickets where SLA due date is between now and the threshold time
    @Query("SELECT t FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED') " +
            "AND t.slaDueAt IS NOT NULL " +
            "AND t.slaDueAt BETWEEN :now AND :threshold")
    List<Ticket> findAtRiskTickets(@Param("now") LocalDateTime now,
                                   @Param("threshold") LocalDateTime threshold);

    // Fetch active tickets where SLA due date has passed
    @Query("SELECT t FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED') " +
            "AND t.slaDueAt IS NOT NULL " +
            "AND t.slaDueAt < :now")
    List<Ticket> findBreachedTickets(@Param("now") LocalDateTime now);
}