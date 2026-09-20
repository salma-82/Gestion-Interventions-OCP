package com.ocp.intervention.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interventions")
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(name = "technicien_id", nullable = false)
    private User technicien;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Column(columnDefinition = "TEXT")
    private String actionADistance; // Simulé pour le niveau N1

    private boolean surSiteEffectue = false; // Pour le niveau N2
    private boolean manipulationLourdeEffectue = false; // Pour le niveau N3

    @Column(columnDefinition = "TEXT")
    private String rapport;

    @Column(columnDefinition = "TEXT")
    private String diagnostic;

    @Column(columnDefinition = "TEXT")
    private String actionsRealisees;

    @Column(columnDefinition = "TEXT")
    private String resultat;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    private String tempsPasse;

    private String statut;

    // Constructeurs
    public Intervention() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public User getTechnicien() { return technicien; }
    public void setTechnicien(User technicien) { this.technicien = technicien; }
    public LocalDateTime getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDateTime dateDebut) { this.dateDebut = dateDebut; }
    public LocalDateTime getDateFin() { return dateFin; }
    public void setDateFin(LocalDateTime dateFin) { this.dateFin = dateFin; }
    public String getActionADistance() { return actionADistance; }
    public void setActionADistance(String actionADistance) { this.actionADistance = actionADistance; }
    public boolean isSurSiteEffectue() { return surSiteEffectue; }
    public void setSurSiteEffectue(boolean surSiteEffectue) { this.surSiteEffectue = surSiteEffectue; }
    public boolean isManipulationLourdeEffectue() { return manipulationLourdeEffectue; }
    public void setManipulationLourdeEffectue(boolean manipulationLourdeEffectue) { this.manipulationLourdeEffectue = manipulationLourdeEffectue; }
    public String getRapport() { return rapport; }
    public void setRapport(String rapport) { this.rapport = rapport; }

    public String getDiagnostic() { return diagnostic; }
    public void setDiagnostic(String diagnostic) { this.diagnostic = diagnostic; }

    public String getActionsRealisees() { return actionsRealisees; }
    public void setActionsRealisees(String actionsRealisees) { this.actionsRealisees = actionsRealisees; }

    public String getResultat() { return resultat; }
    public void setResultat(String resultat) { this.resultat = resultat; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public String getTempsPasse() { return tempsPasse; }
    public void setTempsPasse(String tempsPasse) { this.tempsPasse = tempsPasse; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}