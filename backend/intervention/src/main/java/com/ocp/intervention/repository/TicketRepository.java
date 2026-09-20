package com.ocp.intervention.repository;

import com.ocp.intervention.entity.Ticket;
import com.ocp.intervention.entity.StatutTicket;
import com.ocp.intervention.entity.PrioriteTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    // Module Demandeur : Récupérer toutes les demandes d'un utilisateur spécifique
    List<Ticket> findByDemandeurId(Long demandeurId);
    
    // Module Techniciens N1, N2, N3 : Récupérer les tickets selon le niveau/statut actuel
    List<Ticket> findByStatut(StatutTicket statut);
    
    // Dashboard Admin : Compter les tickets par état pour afficher les statistiques
    long countByStatut(StatutTicket statut);
    long countByPriorite(PrioriteTicket priorite);
}