package com.ocp.intervention.controller;

import com.ocp.intervention.entity.*;
import com.ocp.intervention.service.TechnicienService;
import com.ocp.intervention.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/technicien")
@CrossOrigin(origins = "*")
public class TechnicienController {

    @Autowired private TechnicienService technicienService;
    @Autowired private UserRepository userRepository;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private InterventionRepository interventionRepository;

    // 1. DÉMARRER UNE INTERVENTION (N1, N2 ou N3)
    @PostMapping("/interventions/start")
    public ResponseEntity<Intervention> startIntervention(@RequestBody Map<String, Object> payload) {
        Long ticketId = Long.valueOf(payload.get("ticketId").toString());
        Long techId = Long.valueOf(payload.get("technicienId").toString());
        
        String statutStr = payload.containsKey("statut") && payload.get("statut") != null 
                ? payload.get("statut").toString() : null;
        StatutTicket statut = null;
        if (statutStr != null) {
            try {
                statut = StatutTicket.valueOf(statutStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // mapping robust
                if ("EN_COURS_N1".equalsIgnoreCase(statutStr) || "IN_PROGRESS_N1".equalsIgnoreCase(statutStr)) {
                    statut = StatutTicket.EN_COURS_N1;
                } else if ("EN_COURS_N2".equalsIgnoreCase(statutStr) || "ESCALADE_N2".equalsIgnoreCase(statutStr) || "ESCALATED_N2".equalsIgnoreCase(statutStr)) {
                    statut = StatutTicket.EN_COURS_N2;
                } else if ("EN_COURS_N3".equalsIgnoreCase(statutStr) || "IN_PROGRESS_N3".equalsIgnoreCase(statutStr) || "ESCALADE_N3".equalsIgnoreCase(statutStr) || "ESCALATED_N3".equalsIgnoreCase(statutStr)) {
                    statut = StatutTicket.EN_COURS_N3;
                } else {
                    statut = StatutTicket.EN_COURS;
                }
            }
        }

        User tech = userRepository.findById(techId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));

        // Si le statut n'est pas fourni, le déduire du rôle
        if (statut == null) {
            if (tech.getRole() == Role.ROLE_N1) {
                statut = StatutTicket.EN_COURS_N1;
            } else if (tech.getRole() == Role.ROLE_N2) {
                statut = StatutTicket.EN_COURS_N2;
            } else if (tech.getRole() == Role.ROLE_N3) {
                statut = StatutTicket.EN_COURS_N3;
            } else {
                statut = StatutTicket.EN_COURS;
            }
        }

        return ResponseEntity.ok(technicienService.demarrerIntervention(ticketId, tech, statut));
    }

    // 2. ENREGISTRER UNE ACTION (Détails à distance N1, Sur site N2, ou Matériel Lourd N3)
    @PutMapping("/interventions/{id}/actions")
    public ResponseEntity<Intervention> updateActions(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        
        String remoteAction = payload.containsKey("actionADistance") ? payload.get("actionADistance").toString() : null;
        boolean surSite = payload.containsKey("surSiteEffectue") && Boolean.TRUE.equals(payload.get("surSiteEffectue"));
        boolean heavyHandling = payload.containsKey("manipulationLourdeEffectue") && Boolean.TRUE.equals(payload.get("manipulationLourdeEffectue"));

        return ResponseEntity.ok(technicienService.updateActionDetails(id, remoteAction, surSite, heavyHandling));
    }

    // 2.5 SAUVEGARDER LE RAPPORT D'INTERVENTION (N1)
    @PutMapping("/interventions/{id}/rapport")
    public ResponseEntity<Intervention> saveRapport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        
        String diagnostic = payload.get("diagnostic") != null ? payload.get("diagnostic").toString() : "";
        String actionsRealisees = payload.get("actionsRealisees") != null ? payload.get("actionsRealisees").toString() : "";
        String resultat = payload.get("resultat") != null ? payload.get("resultat").toString() : "";
        String commentaire = payload.get("commentaire") != null ? payload.get("commentaire").toString() : "";
        String tempsPasse = payload.get("tempsPasse") != null ? payload.get("tempsPasse").toString() : "";

        return ResponseEntity.ok(technicienService.saveRapport(id, diagnostic, actionsRealisees, resultat, commentaire, tempsPasse));
    }

    // 3. CLÔTURER LE TICKET DEFINITIVEMENT
    @PostMapping("/interventions/{id}/cloturer")
    public ResponseEntity<?> closeTicket(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String diagnostic = payload.get("diagnostic") != null ? payload.get("diagnostic").toString() : "";
        String actionsRealisees = payload.get("actionsRealisees") != null ? payload.get("actionsRealisees").toString() : "";
        String resultat = payload.get("resultat") != null ? payload.get("resultat").toString() : "";
        String commentaire = payload.get("commentaire") != null ? payload.get("commentaire").toString() : "";
        
        // Fallback robust pour les différentes structures de payload (report ou rapport)
        if (commentaire.trim().isEmpty()) {
            if (payload.get("report") != null) {
                commentaire = payload.get("report").toString();
            } else if (payload.get("rapport") != null) {
                commentaire = payload.get("rapport").toString();
            }
        }
        
        String tempsPasse = payload.get("tempsPasse") != null ? payload.get("tempsPasse").toString() : "";
        String replacementIdStr = (String) payload.get("replacementEquipmentId");
        Long replacementId = null;
        if (replacementIdStr != null && !replacementIdStr.trim().isEmpty() && !"null".equals(replacementIdStr)) {
            try {
                replacementId = Long.valueOf(replacementIdStr);
            } catch (NumberFormatException e) {
                // ignore or log
            }
        }
        technicienService.cloturerTicket(id, diagnostic, actionsRealisees, resultat, commentaire, tempsPasse, replacementId);
        return ResponseEntity.ok().body("Ticket clôturé et rapport enregistré.");
    }

    // 3.5 METTRE À JOUR LE STATUT D'UN ÉQUIPEMENT
    @PutMapping("/equipements/{id}/status")
    public ResponseEntity<?> updateEquipmentStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body("Le champ 'status' est obligatoire.");
        }
        
        StatutEquipement statut;
        try {
            switch (statusStr.toUpperCase()) {
                case "BON":
                case "ACTIF":
                    statut = StatutEquipement.ACTIF;
                    break;
                case "MOYEN":
                case "EN_MAINTENANCE":
                    statut = StatutEquipement.EN_MAINTENANCE;
                    break;
                case "EN_PANNE":
                    statut = StatutEquipement.EN_PANNE;
                    break;
                case "HS":
                case "HORS_SERVICE":
                    statut = StatutEquipement.HORS_SERVICE;
                    break;
                default:
                    statut = StatutEquipement.valueOf(statusStr.toUpperCase());
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Statut invalide : " + statusStr);
        }

        return ResponseEntity.ok(technicienService.updateEquipmentStatus(id, statut));
    }

    // 4. ESCALADER VERS LE NIVEAU SUPÉRIEUR (N1->N2 ou N2->N3)
    @PostMapping("/interventions/{id}/escalader")
    public ResponseEntity<?> escalateTicket(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String rapport = payload.get("rapport");
        if (rapport == null || rapport.trim().isEmpty()) {
            rapport = payload.get("report");
        }
        
        String prochainStatutStr = payload.get("prochainStatut");
        StatutTicket prochainStatut;
        try {
            prochainStatut = StatutTicket.valueOf(prochainStatutStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            if ("ESCALADE_N2".equalsIgnoreCase(prochainStatutStr) || "ESCALATED_N2".equalsIgnoreCase(prochainStatutStr)) {
                prochainStatut = StatutTicket.ESCALADE_N2;
            } else if ("ESCALADE_N3".equalsIgnoreCase(prochainStatutStr) || "ESCALATED_N3".equalsIgnoreCase(prochainStatutStr)) {
                prochainStatut = StatutTicket.ESCALADE_N3;
            } else {
                throw new RuntimeException("Statut d'escalade invalide: " + prochainStatutStr);
            }
        }

        String groupeCibleStr = payload.get("groupeCible");
        Role groupeCible;
        try {
            groupeCible = Role.valueOf(groupeCibleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            if ("ROLE_N2".equalsIgnoreCase(groupeCibleStr)) {
                groupeCible = Role.ROLE_N2;
            } else if ("ROLE_N3".equalsIgnoreCase(groupeCibleStr)) {
                groupeCible = Role.ROLE_N3;
            } else {
                throw new RuntimeException("Groupe cible invalide: " + groupeCibleStr);
            }
        }

        technicienService.escaladerTicket(id, rapport, prochainStatut, groupeCible);
        return ResponseEntity.ok().body("Ticket escaladé avec succès.");
    }

    // 5. OBTENIR LES TICKETS DISPONIBLES (Nouveaux tickets non assignés)
    @GetMapping("/tickets/disponibles")
    public ResponseEntity<List<Ticket>> getTicketsDisponibles() {
        List<Ticket> pending = ticketRepository.findByStatut(StatutTicket.PENDING);
        List<Ticket> ouvert = ticketRepository.findByStatut(StatutTicket.OUVERT);
        List<Ticket> all = new ArrayList<>();
        all.addAll(pending);
        all.addAll(ouvert);
        return ResponseEntity.ok(all);
    }

    // 6. OBTENIR LES TICKETS PAR STATUT (ex: ESCALATED_N2, ESCALATED_N3, PENDING)
    @GetMapping("/tickets")
    public ResponseEntity<List<Ticket>> getTicketsByStatus(@RequestParam(required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            StatutTicket statutEnum = null;
            try {
                statutEnum = StatutTicket.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Gestion robuste des alias de statuts
                if ("ESCALADE_N2".equalsIgnoreCase(status) || "ESCALATED_N2".equalsIgnoreCase(status)) {
                    List<Ticket> list1 = ticketRepository.findByStatut(StatutTicket.ESCALADE_N2);
                    List<Ticket> list2 = ticketRepository.findByStatut(StatutTicket.ESCALATED_N2);
                    List<Ticket> all = new ArrayList<>();
                    all.addAll(list1);
                    all.addAll(list2);
                    return ResponseEntity.ok(all);
                } else if ("ESCALADE_N3".equalsIgnoreCase(status) || "ESCALATED_N3".equalsIgnoreCase(status)) {
                    List<Ticket> list1 = ticketRepository.findByStatut(StatutTicket.ESCALADE_N3);
                    List<Ticket> list2 = ticketRepository.findByStatut(StatutTicket.ESCALATED_N3);
                    List<Ticket> all = new ArrayList<>();
                    all.addAll(list1);
                    all.addAll(list2);
                    return ResponseEntity.ok(all);
                } else if ("OUVERT".equalsIgnoreCase(status) || "PENDING".equalsIgnoreCase(status)) {
                    List<Ticket> list1 = ticketRepository.findByStatut(StatutTicket.OUVERT);
                    List<Ticket> list2 = ticketRepository.findByStatut(StatutTicket.PENDING);
                    List<Ticket> all = new ArrayList<>();
                    all.addAll(list1);
                    all.addAll(list2);
                    return ResponseEntity.ok(all);
                } else if ("EN_COURS_N1".equalsIgnoreCase(status)) {
                    return ResponseEntity.ok(ticketRepository.findByStatut(StatutTicket.EN_COURS_N1));
                } else if ("EN_COURS_N2".equalsIgnoreCase(status)) {
                    return ResponseEntity.ok(ticketRepository.findByStatut(StatutTicket.EN_COURS_N2));
                } else if ("EN_COURS_N3".equalsIgnoreCase(status)) {
                    return ResponseEntity.ok(ticketRepository.findByStatut(StatutTicket.EN_COURS_N3));
                } else {
                    return ResponseEntity.badRequest().build();
                }
            }
            if (statutEnum != null) {
                return ResponseEntity.ok(ticketRepository.findByStatut(statutEnum));
            }
        }
        return ResponseEntity.ok(ticketRepository.findAll());
    }

    // 7. OBTENIR LES INTERVENTIONS ACTIVES D'UN TECHNICIEN (dateFin IS NULL)
    @GetMapping("/interventions/mes")
    public ResponseEntity<List<Intervention>> getMyInterventions(@RequestParam Long technicienId) {
        return ResponseEntity.ok(interventionRepository.findByTechnicienIdAndDateFinIsNull(technicienId));

    }

    // 8. OBTENIR L'HISTORIQUE DES INTERVENTIONS D'UN TECHNICIEN (dateFin IS NOT NULL)
    @GetMapping("/interventions/historique")
    public ResponseEntity<List<Intervention>> getMyHistory(@RequestParam Long technicienId) {
        List<Intervention> all = interventionRepository.findByTechnicienId(technicienId);
        List<Intervention> history = new ArrayList<>();
        for (Intervention i : all) {
            if (i.getDateFin() != null) {
                history.add(i);
            }
        }
        return ResponseEntity.ok(history);
    }

    // 9. OBTENIR TOUTES LES INTERVENTIONS D'UN TICKET
    @GetMapping("/tickets/{ticketId}/interventions")
    public ResponseEntity<List<Intervention>> getTicketInterventions(@PathVariable Long ticketId) {
                return ResponseEntity.ok(interventionRepository.findByTicketId(ticketId));
    }

    // --- N3 Specific Controller Endpoints ---
    @PostMapping("/interventions/{id}/start-n3")
    public ResponseEntity<Intervention> startN3(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long technicienId = Long.valueOf(payload.get("technicienId").toString());
        return ResponseEntity.ok(technicienService.demarrerInterventionN3(id, technicienId));
    }

    @PostMapping("/interventions/{id}/replace-equipment")
    public ResponseEntity<?> replaceEquipment(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long newEquipmentId = Long.valueOf(payload.get("newEquipmentId").toString());
        Long technicienId = Long.valueOf(payload.get("technicienId").toString());
        technicienService.remplacerEquipement(id, newEquipmentId, technicienId);
        return ResponseEntity.ok().body("Equipement remplacé.");
    }

    @PostMapping("/interventions/{id}/close-n3")
    public ResponseEntity<?> closeN3(@PathVariable Long id, @RequestBody com.ocp.intervention.dto.N3ReportDto reportDto) {
        technicienService.fermerInterventionN3(id, reportDto);
        return ResponseEntity.ok().body("Ticket N3 clôturé.");
    }

}