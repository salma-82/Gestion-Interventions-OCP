package com.ocp.intervention.dto;

public class N3ReportDto {
    private String diagnostic;
    private String causeRacine;
    private String actionsRealisees;
    private String equipementRemplace; // equipment code or ID
    private String resultat;
    private String commentaire;
    private String tempsPasse;

    public String getDiagnostic() {
        return diagnostic;
    }
    public void setDiagnostic(String diagnostic) {
        this.diagnostic = diagnostic;
    }
    public String getCauseRacine() {
        return causeRacine;
    }
    public void setCauseRacine(String causeRacine) {
        this.causeRacine = causeRacine;
    }
    public String getActionsRealisees() {
        return actionsRealisees;
    }
    public void setActionsRealisees(String actionsRealisees) {
        this.actionsRealisees = actionsRealisees;
    }
    public String getEquipementRemplace() {
        return equipementRemplace;
    }
    public void setEquipementRemplace(String equipementRemplace) {
        this.equipementRemplace = equipementRemplace;
    }
    public String getResultat() {
        return resultat;
    }
    public void setResultat(String resultat) {
        this.resultat = resultat;
    }
    public String getCommentaire() {
        return commentaire;
    }
    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }
    public String getTempsPasse() {
        return tempsPasse;
    }
    public void setTempsPasse(String tempsPasse) {
        this.tempsPasse = tempsPasse;
    }
}
