package com.ocp.intervention.repository;

import com.ocp.intervention.entity.User;
import com.ocp.intervention.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Darouriya l Spring Security pour l'authentification (Login)
    Optional<User> findByEmail(String email);
    
    // Pour filtrer les utilisateurs par rôle f l-Dashboard Admin
    List<User> findByRole(Role role);
    
    // Compter le nombre total d'utilisateurs par rôle (pour les statistiques du Dashboard)
    long countByRole(Role role);
}