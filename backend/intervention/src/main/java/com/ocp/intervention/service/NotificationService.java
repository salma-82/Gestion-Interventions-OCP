package com.ocp.intervention.service;

import com.ocp.intervention.entity.Notification;
import com.ocp.intervention.entity.Ticket;
import com.ocp.intervention.entity.User;
import com.ocp.intervention.entity.Role;
import com.ocp.intervention.repository.NotificationRepository;
import com.ocp.intervention.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // Créer et sauvegarder une notification pour un utilisateur spécifique
    public void createNotification(String message, User targetUser, Ticket ticket) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setTargetUser(targetUser);
        notification.setTicket(ticket);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    // Notifier TOUS les techniciens d'un certain groupe (ex: ROLE_N1 lors d'un nouveau ticket)
    public void notifyTechniciansGroup(String message, Role role, Ticket ticket) {
        List<User> technicians = userRepository.findByRole(role);
        for (User tech : technicians) {
            createNotification(message, tech, ticket);
        }
    }

    // Récupérer les notifications de l'utilisateur connecté (triées par date récente)
    public List<Notification> getNotificationsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable avec l'ID : " + userId));

        List<Notification> notifications = new ArrayList<>(
                notificationRepository.findByTargetUserIdOrderByDateCreationDesc(userId)
        );

        // L'admin voit aussi les activites recentes du systeme pour eviter une cloche vide
        // quand aucune alerte n'est ciblee directement vers son compte.
        if (user.getRole() == Role.ROLE_ADMIN) {
            List<Notification> recentSystemNotifications = notificationRepository.findTop10ByOrderByDateCreationDesc();
            Map<Long, Notification> uniqueById = new LinkedHashMap<>();

            for (Notification notification : notifications) {
                uniqueById.put(notification.getId(), notification);
            }
            for (Notification notification : recentSystemNotifications) {
                uniqueById.putIfAbsent(notification.getId(), notification);
            }

            notifications = new ArrayList<>(uniqueById.values());
            notifications.sort(Comparator.comparing(Notification::getDateCreation).reversed());

            if (notifications.size() > 20) {
                return new ArrayList<>(notifications.subList(0, 20));
            }
        }

        return notifications;
    }

    // Marquer une notification comme lue
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }
}
