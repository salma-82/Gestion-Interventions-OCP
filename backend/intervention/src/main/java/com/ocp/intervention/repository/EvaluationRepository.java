package com.ocp.intervention.repository;

import com.ocp.intervention.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    
    // Vérifier si un ticket possède déjà une évaluation (Relation @OneToOne unique)
    Optional<Evaluation> findByTicketId(Long ticketId);
}