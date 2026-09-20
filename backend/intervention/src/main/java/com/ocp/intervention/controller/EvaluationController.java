package com.ocp.intervention.controller;

import com.ocp.intervention.dto.EvaluationDto;
import com.ocp.intervention.service.DemandeurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluations")
@CrossOrigin(origins = "*")
public class EvaluationController {

    @Autowired
    private DemandeurService demandeurService;

    @PostMapping
    public ResponseEntity<?> creerEvaluation(@RequestBody EvaluationDto dto) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            EvaluationDto saved = demandeurService.creerEvaluation(dto, userEmail);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<?> getEvaluationParTicket(@PathVariable Long ticketId) {
        try {
            EvaluationDto eval = demandeurService.getEvaluationDto(ticketId);
            return ResponseEntity.ok(eval);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
