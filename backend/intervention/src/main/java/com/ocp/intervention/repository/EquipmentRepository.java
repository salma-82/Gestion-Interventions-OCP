package com.ocp.intervention.repository;

import com.ocp.intervention.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    
    // Trouver un équipement par son code d'inventaire unique
    Optional<Equipment> findByCodeInventaire(String codeInventaire);

    // Trouver les équipements par statut et état d'affectation
    java.util.List<Equipment> findByStatutAndEtatAffectation(
            com.ocp.intervention.entity.StatutEquipement statut,
            com.ocp.intervention.entity.EtatAffectation etatAffectation
    );

    // Trouver tous les équipements par statut
    java.util.List<Equipment> findByStatut(com.ocp.intervention.entity.StatutEquipement statut);
}