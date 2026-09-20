package com.ocp.intervention.dto;

public class EvaluationDto {
    private Long id;
    private Long ticketId;
    private Integer note;
    private String commentaire;

    public EvaluationDto() {}

    public EvaluationDto(Long id, Long ticketId, Integer note, String commentaire) {
        this.id = id;
        this.ticketId = ticketId;
        this.note = note;
        this.commentaire = commentaire;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTicketId() {
        return ticketId;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public Integer getNote() {
        return note;
    }

    public void setNote(Integer note) {
        this.note = note;
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }
}
