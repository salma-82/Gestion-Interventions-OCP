package com.ocp.intervention.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "evaluations")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int note; // Échelle de 1 à 5

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @OneToOne
    @JoinColumn(name = "ticket_id", nullable = false, unique = true) // Une seule évaluation par ticket
    private Ticket ticket;

    // Constructeurs
    public Evaluation() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getNote() { return note; }
    public void setNote(int note) { this.note = note; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
}