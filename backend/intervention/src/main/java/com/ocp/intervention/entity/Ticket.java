package com.ocp.intervention.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

   @Enumerated(EnumType.STRING)
private PrioriteTicket priorite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTicket statut;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateCloture;

    @ManyToOne
    @JoinColumn(name = "demandeur_id", nullable = false)
    private User demandeur;

    @ManyToOne
    @JoinColumn(name = "equipement_id", nullable = false)
    private Equipment equipement;

    // PrePersist pour injecter la date de création automatiquement
    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
        if (this.priorite == null) {
            this.priorite = PrioriteTicket.NORMALE;
        }
    }

    // Constructeurs
    public Ticket() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
public PrioriteTicket getPriorite() {
    return priorite;
}

public void setPriorite(PrioriteTicket priorite) {
    this.priorite = priorite;
}
    public StatutTicket getStatut() { return statut; }
    public void setStatut(StatutTicket statut) { this.statut = statut; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    public LocalDateTime getDateCloture() { return dateCloture; }
    public void setDateCloture(LocalDateTime dateCloture) { this.dateCloture = dateCloture; }
    public User getDemandeur() { return demandeur; }
    public void setDemandeur(User demandeur) { this.demandeur = demandeur; }
    public Equipment getEquipement() { return equipement; }
    public void setEquipement(Equipment equipement) { this.equipement = equipement; }
}
