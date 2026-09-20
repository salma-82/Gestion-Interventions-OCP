package com.ocp.intervention.controller;

import com.ocp.intervention.entity.User;
import com.ocp.intervention.entity.Equipment;
import com.ocp.intervention.entity.Ticket;
import com.ocp.intervention.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired 
    private AdminService adminService;

    // --- GESTION DES UTILISATEURS (CRUD) ---
    @PostMapping("/users")
    public ResponseEntity<User> createOrUpdateUser(@RequestBody User user) {
        return ResponseEntity.ok(adminService.saveUser(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return ResponseEntity.ok(adminService.saveUser(user));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok().body("Utilisateur supprimé avec succès.");
    }

    // --- GESTION DES ÉQUIPEMENTS (CRUD) ---
    @PostMapping("/equipments")
    public ResponseEntity<Equipment> createOrUpdateEquipment(@RequestBody Equipment eq) {
        return ResponseEntity.ok(adminService.saveEquipment(eq));
    }

    @GetMapping("/equipments")
    public ResponseEntity<List<Equipment>> getAllEquipments() {
        return ResponseEntity.ok(adminService.getAllEquipments());
    }

    @DeleteMapping("/equipments/{id}")
    public ResponseEntity<?> deleteEquipment(@PathVariable Long id) {
        adminService.deleteEquipment(id);
        return ResponseEntity.ok().body("Équipement supprimé avec succès.");
    }

    // --- PLANIFICATION PRÉVENTIVE ---
    @PostMapping("/preventive")
    public ResponseEntity<Ticket> planifierPreventive(@RequestBody Ticket ticket, @RequestParam Long demandeurId) {
        return ResponseEntity.ok(adminService.planifierInterventionPreventive(ticket, demandeurId));
    }

    // --- DASHBOARD STATISTIQUES ---
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // New endpoint returning full dashboard data (stats, alerts, recent activities)
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardData());
    }
}