package com.ocp.intervention.controller;

import com.ocp.intervention.entity.Intervention;
import com.ocp.intervention.entity.Role;
import com.ocp.intervention.entity.StatutTicket;
import com.ocp.intervention.entity.Ticket;
import com.ocp.intervention.entity.User;
import com.ocp.intervention.entity.Equipment;
import com.ocp.intervention.dto.N3ReportDto;
import com.ocp.intervention.repository.InterventionRepository;
import com.ocp.intervention.repository.TicketRepository;
import com.ocp.intervention.repository.UserRepository;
import com.ocp.intervention.service.TechnicienService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TechnicianWorkflowController {

    @Autowired private TechnicienService technicienService;
    @Autowired private UserRepository userRepository;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private InterventionRepository interventionRepository;

    @GetMapping("/tickets")
    public ResponseEntity<List<Ticket>> getTickets(@RequestParam(required = false) String status) {
        if (status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(ticketRepository.findAll());
        }

        List<Ticket> tickets = new ArrayList<>();
        for (String item : status.split(",")) {
            StatutTicket mapped = mapTicketStatus(item.trim());
            if (mapped != null) {
                tickets.addAll(ticketRepository.findByStatut(mapped));
            }
        }
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/tickets/{ticketId}/interventions")
    public ResponseEntity<List<Intervention>> getTicketInterventions(@PathVariable Long ticketId) {
        return ResponseEntity.ok(interventionRepository.findByTicketId(ticketId));
    }

    @GetMapping("/interventions/mes")
    public ResponseEntity<List<Intervention>> getMyActiveInterventions(@RequestParam Long technicienId) {
        return ResponseEntity.ok(interventionRepository.findByTechnicienIdAndDateFinIsNull(technicienId));
    }

    @GetMapping("/interventions/historique")
    public ResponseEntity<List<Intervention>> getMyHistory(@RequestParam Long technicienId) {
        List<Intervention> history = new ArrayList<>();
        for (Intervention intervention : interventionRepository.findByTechnicienId(technicienId)) {
            if (intervention.getDateFin() != null) {
                history.add(intervention);
            }
        }
        return ResponseEntity.ok(history);
    }

    @PostMapping("/interventions/start")
    public ResponseEntity<Intervention> startIntervention(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        Long ticketId = requireLong(payload, "ticketId");
        User technicien = resolveTechnicien(payload, authentication);
        StatutTicket statut = mapTicketStatus(stringValue(payload.get("statut")));

        return ResponseEntity.ok(technicienService.demarrerIntervention(ticketId, technicien, statut));
    }

    @PutMapping("/interventions/{id}/rapport")
    public ResponseEntity<Intervention> saveRapport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return ResponseEntity.ok(technicienService.saveRapport(
                id,
                stringValue(payload.get("diagnostic")),
                stringValue(payload.get("actionsRealisees")),
                stringValue(payload.get("resultat")),
                stringValue(payload.get("commentaire")),
                stringValue(payload.get("tempsPasse"))
        ));
    }

    @PutMapping("/interventions/{id}/actions")
    public ResponseEntity<Intervention> updateActions(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        boolean surSite = booleanValue(payload.get("surSiteEffectue"));
        boolean heavyHandling = booleanValue(payload.get("manipulationLourdeEffectue"));
        return ResponseEntity.ok(technicienService.updateActionDetails(
                id,
                stringValue(payload.get("actionADistance")),
                surSite,
                heavyHandling
        ));
    }

    @PostMapping("/interventions/escalate")
    public ResponseEntity<?> escalateIntervention(@RequestBody Map<String, Object> payload) {
        Long interventionId = resolveInterventionId(payload);
        String rapport = firstNonBlank(payload, "rapport", "report", "commentaire");
        StatutTicket prochainStatut = mapTicketStatus(firstNonBlank(payload, "prochainStatut", "status"));
        Role groupeCible = mapRole(firstNonBlank(payload, "groupeCible", "targetRole"));

        technicienService.escaladerTicket(interventionId, rapport, prochainStatut, groupeCible);
        return ResponseEntity.ok(Map.of("message", "Ticket escalade avec succes."));
    }

    @PostMapping("/interventions/resolve")
    public ResponseEntity<?> resolveIntervention(@RequestBody Map<String, Object> payload) {
        Long interventionId = resolveInterventionId(payload);
        technicienService.cloturerTicket(
                interventionId,
                stringValue(payload.get("diagnostic")),
                stringValue(payload.get("actionsRealisees")),
                stringValue(payload.get("resultat")),
                firstNonBlank(payload, "commentaire", "report", "rapport"),
                stringValue(payload.get("tempsPasse")),
                optionalLong(payload.get("replacementEquipmentId"))
        );
        return ResponseEntity.ok(Map.of("message", "Ticket resolu et cloture."));
    }

    private User resolveTechnicien(Map<String, Object> payload, Authentication authentication) {
        Long technicienId = optionalLong(payload.get("technicienId"));
        if (technicienId != null) {
            return userRepository.findById(technicienId)
                    .orElseThrow(() -> new RuntimeException("Technicien introuvable"));
        }
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Utilisateur authentifie introuvable");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));
    }

    private Long resolveInterventionId(Map<String, Object> payload) {
        Long interventionId = optionalLong(payload.get("interventionId"));
        if (interventionId != null) {
            return interventionId;
        }

        Long ticketId = optionalLong(payload.get("ticketId"));
        if (ticketId == null) {
            throw new RuntimeException("interventionId ou ticketId est obligatoire");
        }

        return interventionRepository.findByTicketIdAndDateFinIsNull(ticketId)
                .orElseThrow(() -> new RuntimeException("Intervention active introuvable pour ce ticket"))
                .getId();
    }

    private StatutTicket mapTicketStatus(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String normalized = value.trim().toUpperCase();
        try {
            return StatutTicket.valueOf(normalized);
        } catch (IllegalArgumentException ignored) {
            if ("IN_PROGRESS_N1".equals(normalized)) return StatutTicket.EN_COURS_N1;
            if ("IN_PROGRESS_N2".equals(normalized)) return StatutTicket.EN_COURS_N2;
            if ("IN_PROGRESS_N3".equals(normalized)) return StatutTicket.EN_COURS_N3;
            if ("ESCALATED_N2".equals(normalized)) return StatutTicket.ESCALATED_N2;
            if ("ESCALADE_N2".equals(normalized)) return StatutTicket.ESCALADE_N2;
            if ("ESCALATED_N3".equals(normalized)) return StatutTicket.ESCALATED_N3;
            if ("ESCALADE_N3".equals(normalized)) return StatutTicket.ESCALADE_N3;
            if ("CLOSED".equals(normalized)) return StatutTicket.CLOTURE;
            throw new RuntimeException("Statut ticket invalide: " + value);
        }
    }

    private Role mapRole(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException("groupeCible est obligatoire");
        }

        String normalized = value.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }

        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Role cible invalide: " + value);
        }
    }

    private Long requireLong(Map<String, Object> payload, String key) {
        Long value = optionalLong(payload.get(key));
        if (value == null) {
            throw new RuntimeException(key + " est obligatoire");
        }
        return value;
    }

    private Long optionalLong(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString();
        if (text.trim().isEmpty() || "null".equalsIgnoreCase(text)) {
            return null;
        }
        return Long.valueOf(text);
    }

    private boolean booleanValue(Object value) {
        return value != null && Boolean.parseBoolean(value.toString());
    }

    private String firstNonBlank(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            String value = stringValue(payload.get(key));
            if (!value.trim().isEmpty()) {
                return value;
            }
        }
        return "";
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    // --- N3 Missing endpoints integration ---

    @GetMapping("/equipements/available")
    public ResponseEntity<List<Equipment>> getAvailableEquipments() {
        return ResponseEntity.ok(technicienService.getAvailableEquipments());
    }

    @PutMapping("/tickets/{id}/replace-equipment")
    public ResponseEntity<?> replaceEquipment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        Long newEquipmentId = Long.valueOf(payload.get("newEquipmentId").toString());
        Long technicienId = Long.valueOf(payload.get("technicienId").toString());
        technicienService.remplacerEquipement(id, newEquipmentId, technicienId);
        return ResponseEntity.ok(Map.of("message", "Equipement remplacé."));
    }

    @PostMapping("/n3/interventions/start")
    public ResponseEntity<Intervention> startN3Intervention(@RequestBody Map<String, Object> payload) {
        Long ticketId = Long.valueOf(payload.get("ticketId").toString());
        Long technicienId = Long.valueOf(payload.get("technicienId").toString());
        return ResponseEntity.ok(technicienService.demarrerInterventionN3(ticketId, technicienId));
    }

    @PostMapping("/n3/interventions/{id}/close")
    public ResponseEntity<?> closeN3Intervention(
            @PathVariable Long id,
            @RequestBody N3ReportDto reportDto) {
        // Validation of mandatory fields:
        if (reportDto.getDiagnostic() == null || reportDto.getDiagnostic().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le diagnostic de panne est obligatoire dans le rapport N3."));
        }
        String causeRacine = reportDto.getCauseRacine();
        if (causeRacine == null || causeRacine.trim().isEmpty()) {
            causeRacine = reportDto.getResultat();
        }
        if (causeRacine == null || causeRacine.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le problème racine est obligatoire dans le rapport N3."));
        }
        if (reportDto.getActionsRealisees() == null || reportDto.getActionsRealisees().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "L'action corrective est obligatoire dans le rapport N3."));
        }
        if (reportDto.getCommentaire() == null || reportDto.getCommentaire().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le commentaire est obligatoire dans le rapport N3."));
        }
        if (reportDto.getTempsPasse() == null || reportDto.getTempsPasse().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le temps passé est obligatoire dans le rapport N3."));
        }
        
        technicienService.fermerInterventionN3(id, reportDto);
        return ResponseEntity.ok(Map.of("message", "Ticket N3 clôturé."));
    }
}
