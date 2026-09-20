package com.ocp.intervention.service;

import com.ocp.intervention.entity.*;
import com.ocp.intervention.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TechnicienService {
    private static final Logger logger = LoggerFactory.getLogger(TechnicienService.class);

    @Autowired private TicketRepository ticketRepository;
    @Autowired private InterventionRepository interventionRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private EquipmentRepository equipmentRepository;
    @Autowired private UserRepository userRepository;

    // Mettre à jour le statut d'un équipement
    public Equipment updateEquipmentStatus(Long equipmentId, StatutEquipement statut) {
        Equipment eq = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Équipement introuvable"));
        eq.setStatut(statut);
        return equipmentRepository.save(eq);
    }

    @Transactional
    public Intervention demarrerIntervention(Long ticketId, User technicien, StatutTicket nouveauStatut) {
        logger.info("Démarrage de l'intervention - ticketId: {} technicienId: {}", ticketId, technicien.getId());

        // Vérifier qu'aucune intervention active du MÊME TECHNICIEN n'existe déjà pour ce ticket
        // Pour N3, les interventions N1/N2 précédentes sont déjà terminées (statut ESCALADEE), donc pas de blocage
        boolean activeExistsForSameTech = interventionRepository
                .findByTechnicienIdAndDateFinIsNull(technicien.getId())
                .stream()
                .anyMatch(i -> i.getTicket() != null && i.getTicket().getId().equals(ticketId));
        if (activeExistsForSameTech) {
            throw new RuntimeException("Une intervention active existe déjà pour ce ticket et ce technicien");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        // Déterminer le statut du ticket en fonction du rôle du technicien
        StatutTicket statutCible = nouveauStatut;
        if (technicien.getRole() == Role.ROLE_N1) {
            statutCible = StatutTicket.EN_COURS_N1;
        } else if (technicien.getRole() == Role.ROLE_N2) {
            statutCible = StatutTicket.EN_COURS_N2;
        } else if (technicien.getRole() == Role.ROLE_N3) {
            statutCible = StatutTicket.EN_COURS_N3;
        }
        
        ticket.setStatut(statutCible);
        ticketRepository.save(ticket);

        // Recharger le technicien pour garantir sa persistence
        User techAttached = userRepository.findById(technicien.getId())
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));
        techAttached.setTravaille(true);
        userRepository.save(techAttached);

        Intervention intervention = new Intervention();
        intervention.setTicket(ticket);
        intervention.setTechnicien(techAttached);
        intervention.setDateDebut(LocalDateTime.now());
        intervention.setStatut("EN_COURS");
        if (techAttached.getRole() == Role.ROLE_N1) {
            intervention.setActionADistance("Action à distance");
        }
        if (techAttached.getRole() == Role.ROLE_N3) {
            intervention.setManipulationLourdeEffectue(true);
        }

        Intervention savedIntervention = interventionRepository.save(intervention);

        // Créer une notification de suivi
        if (techAttached.getRole() == Role.ROLE_N3) {
            String msgN3 = "Votre ticket '" + ticket.getTitre() + "' est en cours de traitement par le Technicien N3.";
            notificationService.createNotification(msgN3, ticket.getDemandeur(), ticket);
            notificationService.notifyTechniciansGroup("L'intervention N3 a démarré pour le ticket '" + ticket.getTitre() + "'.", Role.ROLE_ADMIN, ticket);
        } else {
            String msg = "Votre ticket '" + ticket.getTitre() + "' est pris en charge par le technicien " + techAttached.getNom() + ".";
            notificationService.createNotification(msg, ticket.getDemandeur(), ticket);
        }

        return savedIntervention;
    }

    // 2. Clôturer définitivement un ticket (N1, N2 ou N3)
    @Transactional
    public void cloturerTicket(Long interventionId, String diagnostic, String actionsRealisees, String resultat, String commentaire, String tempsPasse, Long replacementEquipmentId) {
        logger.info("Clôture du ticket - interventionId: {}", interventionId);

        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention introuvable"));

        Role techRole = intervention.getTechnicien().getRole();
        String finalRapport;

        if (techRole == Role.ROLE_N2) {
            // ── CLÔTURE N2 ──
            if (commentaire == null || commentaire.trim().isEmpty()) {
                throw new RuntimeException("Le rapport de clôture est obligatoire.");
            }
            parseAndPopulateN2Rapport(intervention, commentaire);
            intervention.setDateFin(LocalDateTime.now());
            autoCalculateTempsPasse(intervention);

            if (intervention.getDiagnostic() == null || intervention.getDiagnostic().trim().isEmpty())
                throw new RuntimeException("Le diagnostic est obligatoire dans le rapport.");
            if (intervention.getActionsRealisees() == null || intervention.getActionsRealisees().trim().isEmpty())
                throw new RuntimeException("Les actions réalisées sont obligatoires dans le rapport.");
            if (intervention.getResultat() == null || intervention.getResultat().trim().isEmpty())
                throw new RuntimeException("Le résultat est obligatoire dans le rapport.");

            finalRapport = commentaire;

        } else if (techRole == Role.ROLE_N3) {
            // ── CLÔTURE N3 ──
            if (commentaire == null || commentaire.trim().isEmpty()) {
                throw new RuntimeException("Le rapport d'expertise N3 est obligatoire.");
            }
            if (commentaire.contains("--- RAPPORT EXPERT TECHNIQUE N3 ---")) {
                parseAndPopulateN3Rapport(intervention, commentaire);
                finalRapport = commentaire;
            } else {
                if (diagnostic != null && !diagnostic.trim().isEmpty()) intervention.setDiagnostic(diagnostic);
                if (actionsRealisees != null && !actionsRealisees.trim().isEmpty()) intervention.setActionsRealisees(actionsRealisees);
                if (resultat != null && !resultat.trim().isEmpty()) intervention.setResultat(resultat);
                if (commentaire != null && !commentaire.trim().isEmpty()) intervention.setCommentaire(commentaire);
                if (tempsPasse != null && !tempsPasse.trim().isEmpty()) intervention.setTempsPasse(tempsPasse);
                
                finalRapport = "--- RAPPORT EXPERT TECHNIQUE N3 ---\n" +
                               "Diagnostic de panne : " + nvl(intervention.getDiagnostic()) + "\n" +
                               "Problème racine : " + nvl(intervention.getResultat()) + "\n" +
                               "Solution / Action corrective appliquée : " + nvl(intervention.getActionsRealisees()) + "\n" +
                               "Équipement Remplacé : " + (replacementEquipmentId != null ? replacementEquipmentId : "Aucun") + "\n" +
                               "Temps total d'intervention : " + nvl(intervention.getTempsPasse()) + "\n" +
                               "Observations de l'expert N3 : " + nvl(intervention.getCommentaire());
            }
            intervention.setDateFin(LocalDateTime.now());
            autoCalculateTempsPasse(intervention);

            if (intervention.getDiagnostic() == null || intervention.getDiagnostic().trim().isEmpty())
                throw new RuntimeException("Le diagnostic de panne est obligatoire dans le rapport N3.");
            if (intervention.getActionsRealisees() == null || intervention.getActionsRealisees().trim().isEmpty())
                throw new RuntimeException("L'action corrective est obligatoire dans le rapport N3.");

        } else {
            // ── CLÔTURE N1 ──
            if (diagnostic != null && !diagnostic.trim().isEmpty()) intervention.setDiagnostic(diagnostic);
            if (actionsRealisees != null && !actionsRealisees.trim().isEmpty()) intervention.setActionsRealisees(actionsRealisees);
            if (resultat != null && !resultat.trim().isEmpty()) intervention.setResultat(resultat);
            if (commentaire != null && !commentaire.trim().isEmpty()) intervention.setCommentaire(commentaire);
            if (tempsPasse != null && !tempsPasse.trim().isEmpty()) intervention.setTempsPasse(tempsPasse);

            finalRapport = "Diagnostic: " + nvl(intervention.getDiagnostic()) + "\n" +
                           "Actions réalisées: " + nvl(intervention.getActionsRealisees()) + "\n" +
                           "Résultat (Problème résolu): " + nvl(intervention.getResultat()) + "\n" +
                           "Commentaire: " + nvl(intervention.getCommentaire()) + "\n" +
                           "Temps passé: " + nvl(intervention.getTempsPasse());
        }

        Ticket ticket = intervention.getTicket();
        ticket.setStatut(StatutTicket.CLOTURE);
        ticket.setDateCloture(LocalDateTime.now());

        // ── Gestion du remplacement d'équipement (N3 principalement) ──
        if (replacementEquipmentId != null) {
            Equipment newEquip = equipmentRepository.findById(replacementEquipmentId)
                    .orElseThrow(() -> new RuntimeException("Équipement de remplacement introuvable"));

            if (newEquip.getStatut() != StatutEquipement.ACTIF || newEquip.getEtatAffectation() != EtatAffectation.DISPONIBLE) {
                throw new RuntimeException("L'équipement de remplacement doit être ACTIF et DISPONIBLE.");
            }

            Equipment oldEquip = ticket.getEquipement();
            if (oldEquip != null) {
                oldEquip.setStatut(StatutEquipement.HORS_SERVICE);
                oldEquip.setEtatAffectation(EtatAffectation.DISPONIBLE);
                equipmentRepository.save(oldEquip);
            }

            newEquip.setEtatAffectation(EtatAffectation.EN_UTILISATION);
            equipmentRepository.save(newEquip);
            ticket.setEquipement(newEquip);

            String replacementLog = "\n\n[INFO REMPLACEMENT ÉQUIPEMENT]\n"
                    + "Ancien équipement : " + (oldEquip != null ? oldEquip.getNom() + " (" + oldEquip.getCodeInventaire() + ")" : "Aucun") + "\n"
                    + "Nouvel équipement : " + newEquip.getNom() + " (" + newEquip.getCodeInventaire() + ")" + "\n"
                    + "Date du remplacement : " + java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(java.time.LocalDateTime.now()) + "\n"
                    + "Technicien responsable : " + (intervention.getTechnicien() != null ? intervention.getTechnicien().getNom() + " " + intervention.getTechnicien().getPrenom() : "N/A");
            finalRapport = finalRapport + replacementLog;
        }

        ticketRepository.save(ticket);

        // Finaliser l'intervention
        intervention.setRapport(finalRapport);
        if (intervention.getDateFin() == null) intervention.setDateFin(LocalDateTime.now());
        intervention.setStatut("TERMINEE");

        // Libérer le technicien
        User tech = intervention.getTechnicien();
        tech.setTravaille(false);
        userRepository.save(tech);
        interventionRepository.save(intervention);

        // RÈGLE MÉTIER: Notifier le demandeur et l'administrateur
        String msg;
        if (techRole == Role.ROLE_N3) {
            msg = "Votre demande a été résolue par le Technicien N3.";
        } else if (techRole == Role.ROLE_N2) {
            msg = "Votre demande a été résolue par le Technicien N2.";
        } else {
            msg = "Votre ticket a été résolu et clôturé par le Technicien N1.";
        }
        notificationService.createNotification(msg, ticket.getDemandeur(), ticket);
        notificationService.notifyTechniciansGroup(msg, Role.ROLE_ADMIN, ticket);
    }

    // 3. Escalader un ticket (De N1 vers N2, ou de N2 vers N3)
    @Transactional
    public void escaladerTicket(Long interventionId, String rapport, StatutTicket statutEscalade, Role groupeCible) {
        logger.info("Escalade du ticket - interventionId: {} vers statut {}", interventionId, statutEscalade);
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention introuvable"));

        if (intervention.getTechnicien().getRole() == Role.ROLE_N3) {
            throw new RuntimeException("Le Technicien N3 est le dernier niveau de traitement : un ticket N3 ne peut plus être escaladé.");
        }

        // Validation du rapport pour N1
        if (intervention.getTechnicien().getRole() == Role.ROLE_N1) {
            if (intervention.getDiagnostic() == null || intervention.getDiagnostic().trim().isEmpty() ||
                intervention.getActionsRealisees() == null || intervention.getActionsRealisees().trim().isEmpty() ||
                intervention.getResultat() == null || intervention.getResultat().trim().isEmpty() ||
                intervention.getCommentaire() == null || intervention.getCommentaire().trim().isEmpty() ||
                intervention.getTempsPasse() == null || intervention.getTempsPasse().trim().isEmpty()) {
                throw new RuntimeException("Le rapport doit être obligatoirement rempli avant d'escalader.");
            }
        }

        // Validation du rapport pour N2
        if (intervention.getTechnicien().getRole() == Role.ROLE_N2) {
            if (rapport == null || rapport.trim().isEmpty()) {
                throw new RuntimeException("Le rapport est obligatoire avant d'escalader.");
            }
            
            parseAndPopulateN2Rapport(intervention, rapport);
            
            intervention.setDateFin(LocalDateTime.now());
            if (intervention.getTempsPasse() == null || intervention.getTempsPasse().trim().isEmpty()) {
                if (intervention.getDateDebut() != null) {
                    java.time.Duration duration = java.time.Duration.between(intervention.getDateDebut(), intervention.getDateFin());
                    long minutes = Math.max(1, duration.toMinutes());
                    if (minutes < 60) {
                        intervention.setTempsPasse(minutes + " min");
                    } else {
                        long hours = minutes / 60;
                        long mins = minutes % 60;
                        intervention.setTempsPasse(hours + "h " + mins + "m");
                    }
                } else {
                    intervention.setTempsPasse("15 min");
                }
            }
            
            if (intervention.getDiagnostic() == null || intervention.getDiagnostic().trim().isEmpty() ||
                intervention.getActionsRealisees() == null || intervention.getActionsRealisees().trim().isEmpty() ||
                intervention.getResultat() == null || intervention.getResultat().trim().isEmpty() ||
                intervention.getTempsPasse() == null || intervention.getTempsPasse().trim().isEmpty()) {
                throw new RuntimeException("Le rapport doit être obligatoirement rempli avant d'escalader.");
            }
        }

        Ticket ticket = intervention.getTicket();
        // Map the escalation status to its corresponding 'ESCALATED' state
        StatutTicket statusToSet;
        switch (statutEscalade) {
            case ESCALADE_N2:
                statusToSet = StatutTicket.ESCALATED_N2;
                break;
            case ESCALADE_N3:
                statusToSet = StatutTicket.ESCALATED_N3;
                break;
            default:
                // Fallback to the provided status if no mapping exists
                statusToSet = statutEscalade;
        }
        ticket.setStatut(statusToSet); // Met à jour vers ESCALATED_N2 ou ESCALATED_N3

        ticketRepository.save(ticket);

        // Terminer l'étape d'intervention actuelle avec son rapport
        String finalRapport = rapport;
        if (intervention.getTechnicien().getRole() == Role.ROLE_N1) {
            finalRapport = "Diagnostic: " + intervention.getDiagnostic() + "\n" +
                           "Actions réalisées: " + intervention.getActionsRealisees() + "\n" +
                           "Résultat (Problème résolu): " + intervention.getResultat() + "\n" +
                           "Commentaire: " + intervention.getCommentaire() + "\n" +
                           "Temps passé: " + intervention.getTempsPasse();
        }
        intervention.setRapport(finalRapport + " [Ticket Escaladé]");
        intervention.setDateFin(LocalDateTime.now());
        intervention.setStatut("ESCALADEE");
        
        // Libérer le technicien et sauvegarder
        User tech = intervention.getTechnicien();
        tech.setTravaille(false);
        userRepository.save(tech);

        interventionRepository.save(intervention);

        // RÈGLE MÉTIER: Notifier le groupe de techniciens supérieur
        String msg;
        if (intervention.getTechnicien().getRole() == Role.ROLE_N2) {
            msg = "Nouveau ticket escaladé depuis le niveau N2.";
        } else {
            msg = "Nouveau ticket escaladé depuis le niveau N1.";
        }
        notificationService.notifyTechniciansGroup(msg, groupeCible, ticket);
    }

    public Intervention updateActionDetails(Long interventionId, String remoteAction, boolean surSite, boolean heavyHandling) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention introuvable"));
        if (remoteAction != null) intervention.setActionADistance(remoteAction);
        intervention.setSurSiteEffectue(surSite);
        intervention.setManipulationLourdeEffectue(heavyHandling);
        
        return interventionRepository.save(intervention);
    }

    @Transactional
    public Intervention saveRapport(Long interventionId, String diagnostic, String actionsRealisees, String resultat, String commentaire, String tempsPasse) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention introuvable"));

        intervention.setDiagnostic(diagnostic);
        intervention.setActionsRealisees(actionsRealisees);
        intervention.setResultat(resultat);
        intervention.setCommentaire(commentaire);
        intervention.setTempsPasse(tempsPasse);

        return interventionRepository.save(intervention);
    }

    // Parsing du rapport N2
    private void parseAndPopulateN2Rapport(Intervention intervention, String report) {
        if (report == null || report.trim().isEmpty()) return;

        String diagnostic = extractField(report, "Diagnostic:");
        if (diagnostic != null && !diagnostic.isEmpty()) intervention.setDiagnostic(diagnostic);

        String actionCorrective = extractField(report, "Action Corrective:");
        if (actionCorrective == null || actionCorrective.isEmpty())
            actionCorrective = extractField(report, "Action Proposée:");
        if (actionCorrective != null && !actionCorrective.isEmpty())
            intervention.setActionsRealisees(actionCorrective);

        String resultat = extractField(report, "Problème Détecté:");
        if (resultat == null || resultat.isEmpty()) resultat = extractField(report, "Résultat:");
        if (resultat == null || resultat.isEmpty()) resultat = "Intervention N2";
        intervention.setResultat(resultat);

        String obs = extractField(report, "Observations Technicien:");
        if (obs == null || obs.isEmpty()) obs = extractField(report, "Observations Escalade:");
        if (obs != null && !obs.isEmpty()) intervention.setCommentaire(obs);

        String tp = extractField(report, "Temps passé:");
        if (tp != null && !tp.isEmpty()) intervention.setTempsPasse(tp);
    }

    // Parsing du rapport expert N3
    // Format attendu: "--- RAPPORT EXPERT TECHNIQUE N3 ---\nDiagnostic de panne : ...\nProblème racine : ...\nSolution / Action corrective appliquée : ...\nÉquipement Remplacé : ...\nTemps total d'intervention : ...\nObservations de l'expert N3 : ...\nNiveau de gravité final : ..."
    private void parseAndPopulateN3Rapport(Intervention intervention, String report) {
        if (report == null || report.trim().isEmpty()) {
            throw new RuntimeException("Le rapport d'expertise N3 est obligatoire.");
        }

        // Diagnostic de panne
        String diag = extractField(report, "Diagnostic de panne");
        if (diag == null || diag.isEmpty()) diag = extractField(report, "Diagnostic");
        if (diag == null || diag.trim().isEmpty()) {
            throw new RuntimeException("Le diagnostic de panne est obligatoire dans le rapport N3.");
        }
        intervention.setDiagnostic(diag);

        // Problème racine
        String probleme = extractField(report, "Problème racine");
        if (probleme == null || probleme.isEmpty()) probleme = extractField(report, "racine");
        if (probleme == null || probleme.isEmpty()) probleme = extractField(report, "Problème");
        if (probleme == null || probleme.isEmpty()) probleme = extractField(report, "Probleme");
        if (probleme == null || probleme.trim().isEmpty()) {
            throw new RuntimeException("La cause racine du problème est obligatoire dans le rapport N3.");
        }
        intervention.setResultat(probleme);

        // Solution / Action corrective appliquée
        String action = extractField(report, "Solution / Action corrective appliquée");
        if (action == null || action.isEmpty()) action = extractField(report, "corrective");
        if (action == null || action.isEmpty()) action = extractField(report, "Solution");
        if (action == null || action.trim().isEmpty()) {
            throw new RuntimeException("L'action corrective appliquée est obligatoire dans le rapport N3.");
        }
        intervention.setActionsRealisees(action);

        // Équipement Remplacé (Validation check)
        String equip = extractField(report, "Équipement Remplacé");
        if (equip == null || equip.isEmpty()) equip = extractField(report, "Equipement Remplace");
        if (equip == null || equip.trim().isEmpty()) {
            throw new RuntimeException("L'information sur l'équipement remplacé ou réparé est obligatoire dans le rapport N3.");
        }

        // Observations de l'expert N3
        String obs = extractField(report, "Observations de l'expert N3");
        if (obs == null || obs.isEmpty()) obs = extractField(report, "Observations");
        if (obs == null || obs.trim().isEmpty()) {
            throw new RuntimeException("Le commentaire / observations de l'expert N3 est obligatoire.");
        }
        intervention.setCommentaire(obs);

        // Temps total d'intervention
        String temps = extractField(report, "Temps total d'intervention");
        if (temps == null || temps.isEmpty()) temps = extractField(report, "Temps total");
        if (temps == null || temps.isEmpty()) temps = extractField(report, "Temps");
        if (temps == null || temps.trim().isEmpty()) {
            throw new RuntimeException("Le temps total d'intervention est obligatoire dans le rapport N3.");
        }
        intervention.setTempsPasse(temps);
    }

    // Auto-calcul du temps passé si non fourni
    private void autoCalculateTempsPasse(Intervention intervention) {
        if (intervention.getTempsPasse() == null || intervention.getTempsPasse().trim().isEmpty()) {
            if (intervention.getDateDebut() != null && intervention.getDateFin() != null) {
                java.time.Duration duration = java.time.Duration.between(intervention.getDateDebut(), intervention.getDateFin());
                long minutes = Math.max(1, duration.toMinutes());
                if (minutes < 60) {
                    intervention.setTempsPasse(minutes + " min");
                } else {
                    long hours = minutes / 60;
                    long mins = minutes % 60;
                    intervention.setTempsPasse(hours + "h " + mins + "m");
                }
            } else {
                intervention.setTempsPasse("15 min");
            }
        }
    }

    // Extraction d'un champ par son libellé
    private String extractField(String report, String fieldLabel) {
        if (report == null || fieldLabel == null) return null;
        
        String normReport = normalizeString(report);
        String normLabel = normalizeString(fieldLabel);
        
        int index = normReport.indexOf(normLabel);
        if (index == -1) return null;
        
        int start = index + normLabel.length();
        int end = normReport.indexOf("\n", start);
        if (end == -1) end = normReport.length();
        
        return cleanFieldValue(report.substring(start, end));
    }

    private String normalizeString(String input) {
        if (input == null) return "";
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase();
    }

    // Nettoyer la valeur d'un champ (retirer le double-point initial s'il existe)
    private String cleanFieldValue(String rawValue) {
        if (rawValue == null) return null;
        String val = rawValue.trim();
        if (val.startsWith(":")) {
            val = val.substring(1).trim();
        }
        return val;
        }

    // Utility method to return empty string for null values
    private String nvl(String value) {
        return value == null ? "" : value;
    }

    // --- N3 Specific Workflow Methods ---

    /**
     * Start an N3 intervention for the given ticket and technician.
     */
    @Transactional
    public Intervention demarrerInterventionN3(Long ticketId, Long technicienId) {
        User technicien = userRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));
        if (technicien.getRole() != Role.ROLE_N3) {
            throw new RuntimeException("Seul un technicien N3 peut démarrer cette intervention");
        }
        return demarrerIntervention(ticketId, technicien, StatutTicket.EN_COURS_N3);
    }

    /**
     * Replace equipment for a ticket during N3 closure.
     */
    @Transactional
    public void remplacerEquipement(Long ticketId, Long newEquipmentId, Long technicienId) {
        User technicien = userRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));
        if (technicien.getRole() != Role.ROLE_N3) {
            throw new RuntimeException("Seul un technicien N3 peut remplacer l'équipement");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        Equipment newEquip = equipmentRepository.findById(newEquipmentId)
                .orElseThrow(() -> new RuntimeException("Équipement de remplacement introuvable"));
        if (newEquip.getStatut() != StatutEquipement.ACTIF || newEquip.getEtatAffectation() != EtatAffectation.DISPONIBLE) {
            throw new RuntimeException("L'équipement de remplacement doit être ACTIF et DISPONIBLE.");
        }
        Equipment oldEquip = ticket.getEquipement();
        if (oldEquip != null) {
            oldEquip.setStatut(StatutEquipement.HORS_SERVICE);
            oldEquip.setEtatAffectation(EtatAffectation.DISPONIBLE);
            equipmentRepository.save(oldEquip);
        }
        newEquip.setEtatAffectation(EtatAffectation.EN_UTILISATION);
        equipmentRepository.save(newEquip);
        ticket.setEquipement(newEquip);
        ticketRepository.save(ticket);

        // Mettre à jour l'intervention active pour marquer l'équipement comme remplacé
        interventionRepository.findByTicketIdAndDateFinIsNull(ticketId).ifPresent(activeInt -> {
            String action = activeInt.getActionADistance();
            if (action != null && action.contains("\"equipmentReplaced\":false")) {
                action = action.replace("\"equipmentReplaced\":false", "\"equipmentReplaced\":true,\"replacementEquipmentId\":" + newEquipmentId);
            } else if (action != null && !action.trim().isEmpty()) {
                int lastBrace = action.lastIndexOf('}');
                if (lastBrace != -1) {
                    action = action.substring(0, lastBrace) + ",\"equipmentReplaced\":true,\"replacementEquipmentId\":" + newEquipmentId + "}";
                }
            } else {
                action = "{\"equipmentReplaced\":true,\"replacementEquipmentId\":" + newEquipmentId + "}";
            }
            activeInt.setActionADistance(action);
            interventionRepository.save(activeInt);
        });
    }

    /**
     * Close an N3 intervention using the provided DTO.
     */
    @Transactional
    public void fermerInterventionN3(Long interventionId, com.ocp.intervention.dto.N3ReportDto reportDto) {
        Long replacementId = null;
        String equipStr = reportDto.getEquipementRemplace();
        if (equipStr != null && !equipStr.trim().isEmpty()) {
            try {
                replacementId = Long.valueOf(equipStr.trim());
            } catch (NumberFormatException e) {
                // ignore invalid format
            }
        }
        if (reportDto.getDiagnostic() == null || reportDto.getDiagnostic().trim().isEmpty()) {
            throw new RuntimeException("Le diagnostic de panne est obligatoire dans le rapport N3.");
        }
        if (reportDto.getActionsRealisees() == null || reportDto.getActionsRealisees().trim().isEmpty()) {
            throw new RuntimeException("L'action corrective est obligatoire dans le rapport N3.");
        }
        if (reportDto.getCommentaire() == null || reportDto.getCommentaire().trim().isEmpty()) {
            throw new RuntimeException("Le commentaire est obligatoire dans le rapport N3.");
        }
        cloturerTicket(interventionId,
                reportDto.getDiagnostic(),
                reportDto.getActionsRealisees(),
                reportDto.getResultat(),
                reportDto.getCommentaire(),
                reportDto.getTempsPasse(),
                replacementId);
    }

    public java.util.List<Equipment> getAvailableEquipments() {
        return equipmentRepository.findByStatutAndEtatAffectation(StatutEquipement.ACTIF, EtatAffectation.DISPONIBLE);
    }
}
// Database Reset Trigger