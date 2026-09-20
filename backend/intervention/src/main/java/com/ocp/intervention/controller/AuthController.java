package com.ocp.intervention.controller;

import com.ocp.intervention.entity.User;
import com.ocp.intervention.repository.UserRepository;
import com.ocp.intervention.security.JwtUtil;
import com.ocp.intervention.service.EmailVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailVerificationService emailVerificationService;

    // ─────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email    = loginRequest.get("email");
        String password = loginRequest.get("password");

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, password)
        );

        User user  = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        Map<String, Object> response = new HashMap<>();
        response.put("token",  token);
        response.put("role",   user.getRole().name());
        response.put("userId", user.getId());

        String redirectTo = "/dashboard";
        if (user.getRole().name().equals("ROLE_ADMIN"))       redirectTo = "/admin";
        else if (user.getRole().name().equals("ROLE_DEMANDEUR")) redirectTo = "/demandeur";
        else if (user.getRole().name().startsWith("ROLE_N"))  redirectTo = "/technicien";

        response.put("redirectTo", redirectTo);
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/auth/me  — Profil de l'utilisateur connecté
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("Authorization") String authHeader) {
        String email = extractEmailFromHeader(authHeader);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("id",        user.getId());
        profile.put("nom",       user.getNom());
        profile.put("prenom",    user.getPrenom());
        profile.put("email",     user.getEmail());
        profile.put("telephone", user.getTelephone());
        profile.put("role",      user.getRole().name().replace("ROLE_", ""));
        profile.put("status",    user.isStatus());

        return ResponseEntity.ok(profile);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/verify-password  — Vérifier le MDP actuel
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {

        String email    = extractEmailFromHeader(authHeader);
        String password = body.get("password");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Mot de passe actuel incorrect.");
            return ResponseEntity.status(401).body(error);
        }

        return ResponseEntity.ok(Map.of("message", "Mot de passe vérifié."));
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/send-verification  — Envoyer le code OTP
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification(
            @RequestHeader("Authorization") String authHeader) {

        String email = extractEmailFromHeader(authHeader);

        // S'assurer que l'utilisateur existe
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Le code est toujours généré et stocké. L'email est optionnel.
        Map<String, Object> sendResult = emailVerificationService.sendVerificationCode(email);
        boolean emailSent = Boolean.TRUE.equals(sendResult.get("emailSent"));
        String code       = (String) sendResult.get("code");

        Map<String, Object> result = new HashMap<>();
        result.put("emailSent", emailSent);
        if (emailSent) {
            result.put("message", "Code de vérification envoyé à " + email + ".");
        } else {
            result.put("message", "Email non configuré — utilisez le code ci-dessous.");
            result.put("devCode", code);  // affiché dans l'UI en mode dev
        }

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/check-otp  — Vérifier le code OTP (sans le consommer)
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/check-otp")
    public ResponseEntity<?> checkOtp(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {

        String email = extractEmailFromHeader(authHeader);
        String code  = body.get("code");

        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("error", "Le code est requis."));
        }

        if (!emailVerificationService.checkCode(email, code.trim())) {
            return ResponseEntity.status(400).body(Map.of("error", "Code incorrect ou expiré. Vérifiez votre email et réessayez."));
        }

        return ResponseEntity.ok(Map.of("message", "Code valide."));
    }


    // ─────────────────────────────────────────────────────────────
    // PUT /api/auth/change-password  — Changer le MDP
    // ─────────────────────────────────────────────────────────────
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {

        String email            = extractEmailFromHeader(authHeader);
        String currentPassword  = body.get("currentPassword");
        String newPassword      = body.get("newPassword");
        String verificationCode = body.get("verificationCode");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // 1. Revérifier le MDP actuel
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Mot de passe actuel incorrect."));
        }

        // 2. Valider le code OTP
        if (!emailVerificationService.verifyCode(email, verificationCode)) {
            return ResponseEntity.status(400).body(Map.of("error", "Code de vérification invalide ou expiré."));
        }

        // 3. Mettre à jour le mot de passe
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Mot de passe mis à jour avec succès."));
    }

    // ─────────────────────────────────────────────────────────────
    // Helper : extraire l'email depuis le header Authorization
    // ─────────────────────────────────────────────────────────────
    private String extractEmailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token JWT manquant ou invalide.");
        }
        String token = authHeader.substring(7);
        return jwtUtil.extractUsername(token);
    }
}