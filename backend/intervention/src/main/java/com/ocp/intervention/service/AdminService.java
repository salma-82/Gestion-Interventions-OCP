package com.ocp.intervention.service;

import com.ocp.intervention.entity.*;
import com.ocp.intervention.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private EquipmentRepository equipmentRepository;
    @Autowired private TicketRepository ticketRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private PasswordEncoder passwordEncoder;

    // CRUD Utilisateurs
    public User saveUser(User user) {
        if (user.getId() == null) {
            // New user creation
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        } else {
            // Existing user update
            User existingUser = userRepository.findById(user.getId()).orElse(null);
            if (existingUser != null) {
                if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                    user.setPassword(existingUser.getPassword());
                } else {
                    user.setPassword(passwordEncoder.encode(user.getPassword()));
                }
            }
        }
        return userRepository.save(user);
    }
    public List<User> getAllUsers() { return userRepository.findAll(); }
    public void deleteUser(Long id) { userRepository.deleteById(id); }

    // CRUD Équipements
    public Equipment saveEquipment(Equipment eq) { return equipmentRepository.save(eq); }
    public List<Equipment> getAllEquipments() { return equipmentRepository.findAll(); }
    public void deleteEquipment(Long id) { equipmentRepository.deleteById(id); }

    // Planifier une intervention préventive
    public Ticket planifierInterventionPreventive(Ticket ticket, Long demandeurId) {
        User demandeur = userRepository.findById(demandeurId)
                .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));
        
        ticket.setDemandeur(demandeur);
        ticket.setStatut(StatutTicket.PENDING); // Commence en attente
        Ticket savedTicket = ticketRepository.save(ticket);

        // Notification automatique au demandeur concerné
        String msg = "Une intervention préventive a été planifiée pour votre équipement: " + ticket.getEquipement().getNom();
        notificationService.createNotification(msg, demandeur, savedTicket);

        return savedTicket;
    }

    // Statistiques pour le Dashboard Admin
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("urgentCount",
        ticketRepository.countByPriorite(PrioriteTicket.URGENT));

stats.put("moyenneCount",
        ticketRepository.countByPriorite(PrioriteTicket.MOYENNE));

stats.put("normaleCount",
        ticketRepository.countByPriorite(PrioriteTicket.NORMALE));
        stats.put("ticketsPending", ticketRepository.countByStatut(StatutTicket.PENDING));
        stats.put("ticketsInProgressN1", ticketRepository.countByStatut(StatutTicket.IN_PROGRESS_N1));
        stats.put("ticketsEscalatedN2", ticketRepository.countByStatut(StatutTicket.ESCALATED_N2));
        stats.put("ticketsEscalatedN3", ticketRepository.countByStatut(StatutTicket.ESCALATED_N3));
      long closedCount =
        ticketRepository.countByStatut(StatutTicket.CLOSED)
      + ticketRepository.countByStatut(StatutTicket.CLOTURE);

stats.put("ticketsClosed", closedCount);
        return stats;
    }

    // Full dashboard data including recent notifications
    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = getDashboardStats();
        // Add recent activities (using notifications as proxy for activities)
        List<Notification> recent = notificationRepository.findTop10ByOrderByDateCreationDesc();
        data.put("recentActivities", recent);
        // Example alerts (hard‑coded for now, can be refined later)
        List<String> alerts = new java.util.ArrayList<>();
        if ((Long) data.getOrDefault("ticketsPending", 0L) > 0) {
            alerts.add("🔴 Tickets en attente");
        }
        data.put("alerts", alerts);
        return data;
    }
}