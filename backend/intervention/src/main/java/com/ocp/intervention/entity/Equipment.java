package com.ocp.intervention.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "equipements")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_inventaire", nullable = false, unique = true)
    private String codeInventaire;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String marque;

    @Column(nullable = false)
    private String modele;

    @Column(name = "numero_serie", nullable = false)
    private String numeroSerie;

    private String localisation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutEquipement statut;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_affectation", nullable = false)
    private EtatAffectation etatAffectation;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Constructeurs
    public Equipment() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodeInventaire() { return codeInventaire; }
    public void setCodeInventaire(String codeInventaire) { this.codeInventaire = codeInventaire; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getNumeroSerie() { return numeroSerie; }
    public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public StatutEquipement getStatut() { return statut; }
    public void setStatut(StatutEquipement statut) { this.statut = statut; }

    public EtatAffectation getEtatAffectation() { return etatAffectation; }
    public void setEtatAffectation(EtatAffectation etatAffectation) { this.etatAffectation = etatAffectation; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}