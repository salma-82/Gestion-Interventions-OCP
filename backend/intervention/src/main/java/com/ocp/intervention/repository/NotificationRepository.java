package com.ocp.intervention.repository;

import com.ocp.intervention.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Système Transverse : Récupérer les alertes d'un utilisateur triées de la plus récente à la plus ancienne
    List<Notification> findByTargetUserIdOrderByDateCreationDesc(Long targetUserId);
    
    // Optionnel : Compter le nombre de notifications non lues pour afficher le badge sur la cloche (Navbar)
    long countByTargetUserIdAndIsReadFalse(Long targetUserId);
    // New method to fetch the latest 10 notifications system‑wide
    List<Notification> findTop10ByOrderByDateCreationDesc();
}