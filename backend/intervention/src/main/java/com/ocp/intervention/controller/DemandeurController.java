package com.ocp.intervention.controller;

import com.ocp.intervention.entity.Equipment;
import com.ocp.intervention.entity.Ticket;
import com.ocp.intervention.entity.Evaluation;
import com.ocp.intervention.entity.Intervention;
import com.ocp.intervention.service.DemandeurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/demandeur")
@CrossOrigin(origins = "*")
public class DemandeurController {

    @Autowired 
    private DemandeurService demandeurService;

    // Lister les équipements disponibles (pour le dropdown du formulaire de ticket)
    @GetMapping("/equipements")
    public ResponseEntity<List<Equipment>> getEquipementsDisponibles() {
        return ResponseEntity.ok(demandeurService.getEquipementsDisponibles());
    }

    // Créer un nouveau ticket (Demande d'intervention)
    @PostMapping("/tickets")
    public ResponseEntity<Ticket> creerTicket(@RequestBody Ticket ticket, @RequestParam Long demandeurId) {
        return ResponseEntity.ok(demandeurService.creerTicket(ticket, demandeurId));
    }

    // Suivre mes propres demandes
    @GetMapping("/tickets")
    public ResponseEntity<List<Ticket>> getMesTickets(@RequestParam Long demandeurId) {
        return ResponseEntity.ok(demandeurService.getMesTickets(demandeurId));
    }

    @GetMapping("/tickets/{ticketId}/evaluation")
    public ResponseEntity<Evaluation> getEvaluation(@PathVariable Long ticketId) {
        return ResponseEntity.ok(demandeurService.getEvaluation(ticketId));
    }

    @GetMapping("/tickets/{ticketId}/interventions")
    public ResponseEntity<List<Intervention>> getTicketInterventions(@PathVariable Long ticketId) {
        return ResponseEntity.ok(demandeurService.getTicketInterventions(ticketId));
    }
}