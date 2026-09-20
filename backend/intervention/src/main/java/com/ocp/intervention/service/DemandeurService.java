package com.ocp.intervention.service;

import com.ocp.intervention.entity.Equipment;
import com.ocp.intervention.entity.Ticket;
import com.ocp.intervention.entity.User;
import com.ocp.intervention.entity.Evaluation;
import com.ocp.intervention.entity.StatutTicket;
import com.ocp.intervention.entity.StatutEquipement;
import com.ocp.intervention.entity.Role;
import com.ocp.intervention.entity.PrioriteTicket;
import com.ocp.intervention.repository.EquipmentRepository;
import com.ocp.intervention.repository.TicketRepository;
import com.ocp.intervention.repository.UserRepository;
import com.ocp.intervention.repository.EvaluationRepository;
import com.ocp.intervention.repository.InterventionRepository;
import com.ocp.intervention.entity.Intervention;
import com.ocp.intervention.dto.EvaluationDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DemandeurService {

    @Autowired 
    private TicketRepository ticketRepository;

    @Autowired 
    private UserRepository userRepository;

    @Autowired 
    private EvaluationRepository evaluationRepository;

    @Autowired 
    private EquipmentRepository equipmentRepository;

    @Autowired 
    private NotificationService notificationService;

    @Autowired
    private InterventionRepository interventionRepository;

    // Retourner tous les équipements sauf HORS_SERVICE (pour le dropdown du formulaire)
    public List<Equipment> getEquipementsDisponibles() {
        return equipmentRepository.findAll().stream()
                .filter(e -> e.getStatut() != StatutEquipement.HORS_SERVICE)
                .collect(Collectors.toList());
    }

    public Ticket creerTicket(Ticket ticket, Long demandeurId) {
        // 1. Load demandeur
        User demandeur = userRepository.findById(demandeurId)
                .orElseThrow(() -> new RuntimeException("Demandeur introuvable avec l'ID : " + demandeurId));

        // 2. Load equipment (must exist and not be HORS_SERVICE)
        Long equipId = ticket.getEquipement() != null ? ticket.getEquipement().getId() : null;
        if (equipId == null) {
            throw new RuntimeException("ID d'équipement manquant dans le ticket.");
        }
        Equipment equipment = equipmentRepository.findById(equipId)
                .orElseThrow(() -> new RuntimeException("Équipement introuvable avec l'ID : " + equipId));
        // Optional: enforce that equipment is not HORS_SERVICE
        if (equipment.getStatut() == StatutEquipement.HORS_SERVICE) {
            throw new RuntimeException("Impossible de créer un ticket pour un équipement hors service.");
        }
        // 3. Populate ticket fields
        ticket.setDemandeur(demandeur);
        ticket.setEquipement(equipment);
        ticket.setStatut(StatutTicket.PENDING);
        if (ticket.getPriorite() == null) {
            ticket.setPriorite(PrioriteTicket.NORMALE);
        }
        Ticket savedTicket = ticketRepository.save(ticket);
        // 2. Récupère la priorité de manière sécurisée


        // 4. Notify N1 technicians
        PrioriteTicket priorite = savedTicket.getPriorite() != null ? savedTicket.getPriorite() : PrioriteTicket.NORMALE;
        String msg = "Nouveau ticket disponible [" 
            + priorite.getLabel() 
            + "] : " 
            + savedTicket.getTitre();
        notificationService.notifyTechniciansGroup(msg, Role.ROLE_N1, savedTicket);

        return savedTicket;
    }

    public List<Ticket> getMesTickets(Long demandeurId) {
        return ticketRepository.findByDemandeurId(demandeurId);
    }

    public EvaluationDto creerEvaluation(EvaluationDto dto, String userEmail) {
        if (dto.getTicketId() == null) {
            throw new RuntimeException("L'ID du ticket est obligatoire.");
        }
        if (dto.getNote() == null) {
            throw new RuntimeException("La note est obligatoire.");
        }
        if (dto.getNote() < 1 || dto.getNote() > 5) {
            throw new RuntimeException("La note doit être comprise entre 1 et 5.");
        }

        Ticket ticket = ticketRepository.findById(dto.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket introuvable avec l'ID : " + dto.getTicketId()));

        // Validation : seul le propriétaire du ticket peut l'évaluer
        if (!ticket.getDemandeur().getEmail().equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Seul le propriétaire du ticket peut l'évaluer.");
        }

        if (ticket.getStatut() != StatutTicket.CLOSED && ticket.getStatut() != StatutTicket.CLOTURE) {
            throw new RuntimeException("Impossible d'évaluer une intervention non clôturée !");
        }

        // Une seule évaluation autorisée par ticket
        if (evaluationRepository.findByTicketId(dto.getTicketId()).isPresent()) {
            throw new RuntimeException("Une évaluation existe déjà pour ce ticket.");
        }

        Evaluation evaluation = new Evaluation();
        evaluation.setTicket(ticket);
        evaluation.setNote(dto.getNote());
        evaluation.setCommentaire(dto.getCommentaire());
        Evaluation savedEval = evaluationRepository.save(evaluation);

        // Notifier le technicien de l'intervention et l'administrateur
        String msg = "Une nouvelle évaluation est disponible pour le ticket '" + ticket.getTitre() + "' (Note: " + evaluation.getNote() + "/5).";

        List<Intervention> interventions = interventionRepository.findByTicketId(dto.getTicketId());
        for (Intervention i : interventions) {
            if (i.getTechnicien() != null) {
                notificationService.createNotification(msg, i.getTechnicien(), ticket);
            }
        }

        notificationService.notifyTechniciansGroup(msg, Role.ROLE_ADMIN, ticket);

        return new EvaluationDto(savedEval.getId(), savedEval.getTicket().getId(), savedEval.getNote(), savedEval.getCommentaire());
    }

    public EvaluationDto getEvaluationDto(Long ticketId) {
        Evaluation eval = evaluationRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Aucune évaluation trouvée pour le ticket ID : " + ticketId));
        return new EvaluationDto(eval.getId(), eval.getTicket().getId(), eval.getNote(), eval.getCommentaire());
    }

    public Evaluation getEvaluation(Long ticketId) {
        return evaluationRepository.findByTicketId(ticketId).orElse(null);
    }

    public List<Intervention> getTicketInterventions(Long ticketId) {
        return interventionRepository.findByTicketId(ticketId);
    }
}
