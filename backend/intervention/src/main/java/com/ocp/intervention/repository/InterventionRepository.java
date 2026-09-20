package com.ocp.intervention.repository;

import com.ocp.intervention.entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    // Existing method to get all interventions for a technicien
    List<Intervention> findByTechnicienId(Long technicienId);

    // New method to check if a technicien has an active intervention (dateFin is null)
    List<Intervention> findByTechnicienIdAndDateFinIsNull(Long technicienId);

    // New method to check if a ticket already has an active intervention
    Optional<Intervention> findByTicketIdAndDateFinIsNull(Long ticketId);

    // Existing method to get all interventions linked to a ticket
    List<Intervention> findByTicketId(Long ticketId);
}