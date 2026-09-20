package com.ocp.intervention;

import com.ocp.intervention.controller.EvaluationController;
import com.ocp.intervention.dto.EvaluationDto;
import com.ocp.intervention.entity.*;
import com.ocp.intervention.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class EvaluationControllerTest {

    @Autowired
    private EvaluationController evaluationController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User demandeur;

    private Equipment equipment;
    private Ticket ticketClosed;
    private Ticket ticketOpen;

    @BeforeEach
    void setUp() {
        // Clear transaction-specific entities
        evaluationRepository.deleteAll();
        interventionRepository.deleteAll();
        notificationRepository.deleteAll();
        ticketRepository.deleteAll();

        // 1. Get seeded Users from data.sql
        demandeur = userRepository.findByEmail("demandeur@ocp.ma")
                .orElseThrow(() -> new RuntimeException("Demandeur introuvable dans data.sql"));



        // 2. Get seeded Equipment from data.sql
        equipment = equipmentRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Equipement introuvable dans data.sql"));

        // 3. Create Tickets for testing
        ticketClosed = new Ticket();
        ticketClosed.setTitre("Incident fermé");
        ticketClosed.setDescription("Panne résolue");
        ticketClosed.setPriorite(PrioriteTicket.NORMALE);
        ticketClosed.setStatut(StatutTicket.CLOTURE);
        ticketClosed.setDemandeur(demandeur);
        ticketClosed.setEquipement(equipment);
        ticketClosed = ticketRepository.save(ticketClosed);

        ticketOpen = new Ticket();
        ticketOpen.setTitre("Incident en cours");
        ticketOpen.setDescription("En attente N1");
        ticketOpen.setPriorite(PrioriteTicket.URGENT);
        ticketOpen.setStatut(StatutTicket.PENDING);
        ticketOpen.setDemandeur(demandeur);
        ticketOpen.setEquipement(equipment);
        ticketOpen = ticketRepository.save(ticketOpen);
    }

    private void setSecurityContext(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, Collections.singletonList(new SimpleGrantedAuthority(role)))
        );
    }

    @Test
    void testCreerEvaluationSuccess() {
        setSecurityContext("demandeur@ocp.ma", "ROLE_DEMANDEUR");

        EvaluationDto dto = new EvaluationDto();
        dto.setTicketId(ticketClosed.getId());
        dto.setNote(5);
        dto.setCommentaire("Très rapide et efficace");

        ResponseEntity<?> response = evaluationController.creerEvaluation(dto);
        assertEquals(200, response.getStatusCode().value());
        
        EvaluationDto result = (EvaluationDto) response.getBody();
        assertNotNull(result);
        assertEquals(ticketClosed.getId(), result.getTicketId());
        assertEquals(5, result.getNote());
        assertEquals("Très rapide et efficace", result.getCommentaire());
    }

    @Test
    void testCreerEvaluationNonClotureFail() {
        setSecurityContext("demandeur@ocp.ma", "ROLE_DEMANDEUR");

        EvaluationDto dto = new EvaluationDto();
        dto.setTicketId(ticketOpen.getId());
        dto.setNote(4);
        dto.setCommentaire("Moyen");

        ResponseEntity<?> response = evaluationController.creerEvaluation(dto);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testCreerEvaluationNonProprietaireFail() {
        setSecurityContext("admin@ocp.ma", "ROLE_ADMIN");

        EvaluationDto dto = new EvaluationDto();
        dto.setTicketId(ticketClosed.getId());
        dto.setNote(4);

        ResponseEntity<?> response = evaluationController.creerEvaluation(dto);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testCreerEvaluationNoteInvalideFail() {
        setSecurityContext("demandeur@ocp.ma", "ROLE_DEMANDEUR");

        EvaluationDto dto = new EvaluationDto();
        dto.setTicketId(ticketClosed.getId());
        dto.setNote(6); // Invalid rating

        ResponseEntity<?> response = evaluationController.creerEvaluation(dto);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testCreerEvaluationDoublonFail() {
        setSecurityContext("demandeur@ocp.ma", "ROLE_DEMANDEUR");

        // Create initial evaluation
        Evaluation eval = new Evaluation();
        eval.setTicket(ticketClosed);
        eval.setNote(4);
        eval.setCommentaire("Good");
        evaluationRepository.save(eval);

        EvaluationDto dto = new EvaluationDto();
        dto.setTicketId(ticketClosed.getId());
        dto.setNote(5);

        ResponseEntity<?> response = evaluationController.creerEvaluation(dto);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void testGetEvaluationSuccess() {
        setSecurityContext("demandeur@ocp.ma", "ROLE_DEMANDEUR");

        // Create evaluation
        Evaluation eval = new Evaluation();
        eval.setTicket(ticketClosed);
        eval.setNote(3);
        eval.setCommentaire("Moyen");
        evaluationRepository.save(eval);

        ResponseEntity<?> response = evaluationController.getEvaluationParTicket(ticketClosed.getId());
        assertEquals(200, response.getStatusCode().value());
        
        EvaluationDto result = (EvaluationDto) response.getBody();
        assertNotNull(result);
        assertEquals(3, result.getNote());
        assertEquals("Moyen", result.getCommentaire());
    }

    @Test
    void testGetEvaluationNotFound() {
        setSecurityContext("demandeur@ocp.ma", "ROLE_DEMANDEUR");

        ResponseEntity<?> response = evaluationController.getEvaluationParTicket(ticketClosed.getId());
        assertEquals(404, response.getStatusCode().value());
    }
}
