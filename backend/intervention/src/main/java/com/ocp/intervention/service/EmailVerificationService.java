package com.ocp.intervention.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.verification.code.expiry-minutes:10}")
    private int expiryMinutes;

    // Stockage en mémoire : email -> {code, expiry}
    private final Map<String, VerificationEntry> codeStore = new ConcurrentHashMap<>();

    private static class VerificationEntry {
        String code;
        LocalDateTime expiry;

        VerificationEntry(String code, int expiryMinutes) {
            this.code = code;
            this.expiry = LocalDateTime.now().plusMinutes(expiryMinutes);
        }

        boolean isValid(String code) {
            return this.code.equals(code) && LocalDateTime.now().isBefore(this.expiry);
        }
    }

    /**
     * Génère un code à 6 chiffres, le stocke et tente de l'envoyer par email.
     * Si l'email échoue (SMTP non configuré), le code est loggué et retourné
     * pour permettre le flux sans configuration email.
     *
     * @return le code généré (toujours disponible même si l'email échoue)
     */
    /**
     * Génère et envoie (si SMTP configuré) le code OTP.
     * @return map avec 'code' (toujours) et 'emailSent' (true si email envoyé avec succès)
     */
    public Map<String, Object> sendVerificationCode(String email) {
        String code = generateCode();
        codeStore.put(email, new VerificationEntry(code, expiryMinutes));

        boolean emailSent = false;

        // Vérifier que le username et le password ne sont pas des placeholders
        boolean smtpConfigured = fromEmail != null
                && !fromEmail.isEmpty()
                && !fromEmail.contains("TON_EMAIL")
                && !fromEmail.contains("your-gmail");

        if (smtpConfigured) {
            try {
                jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, "utf-8");
                
                helper.setFrom(fromEmail, "OCP Groupe");
                helper.setTo(email);
                helper.setSubject("Code de vérification - OCP GMAO");
                
                String htmlMsg = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;\">" +
                        "<div style=\"background-color: #00844A; padding: 20px; text-align: center;\">" +
                        "<h2 style=\"color: white; margin: 0;\">OCP GMAO</h2>" +
                        "</div>" +
                        "<div style=\"padding: 30px; background-color: #ffffff;\">" +
                        "<h3 style=\"color: #333;\">Bonjour,</h3>" +
                        "<p style=\"color: #555; font-size: 16px; line-height: 1.5;\">Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :</p>" +
                        "<div style=\"text-align: center; margin: 30px 0;\">" +
                        "<span style=\"background-color: #f4f4f4; border: 2px dashed #00844A; color: #00844A; font-size: 28px; font-weight: bold; padding: 15px 30px; letter-spacing: 5px; border-radius: 8px;\">" + code + "</span>" +
                        "</div>" +
                        "<p style=\"color: #777; font-size: 14px;\">Ce code est valable pendant <strong>" + expiryMinutes + " minutes</strong>.</p>" +
                        "<p style=\"color: #777; font-size: 14px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;\">Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité.</p>" +
                        "</div>" +
                        "<div style=\"background-color: #f8f9fa; padding: 15px; text-align: center; color: #888; font-size: 12px;\">" +
                        "&copy; " + LocalDateTime.now().getYear() + " OCP Groupe - Gestion des Interventions GMAO" +
                        "</div>" +
                        "</div>";
                
                helper.setText(htmlMsg, true);
                mailSender.send(mimeMessage);
                emailSent = true;
                log.info("[OTP] Code envoyé par email à {}", email);
            } catch (Exception e) {
                log.warn("[OTP] Échec envoi email à {} : {}", email, e.getMessage());
            }
        } else {
            log.warn("[OTP] SMTP non configuré — email non envoyé à {}", email);
        }

        // Toujours loguer le code en console
        log.info("=======================================================");
        log.info("[OTP] Code pour {} : {}  (emailSent={})", email, code, emailSent);
        log.info("=======================================================");

        Map<String, Object> result = new HashMap<>();
        result.put("code", code);
        result.put("emailSent", emailSent);
        return result;
    }

    /**
     * Vérifie le code SANS le consommer (utilisé à l'étape 2 pour valider avant de passer à l'étape 3).
     */
    public boolean checkCode(String email, String code) {
        VerificationEntry entry = codeStore.get(email);
        if (entry == null) return false;
        return entry.isValid(code); // NE supprime PAS le code
    }

    /**
     * Vérifie le code ET le consomme (utilisé à l'étape 3, au moment du changement de mot de passe).
     */
    public boolean verifyCode(String email, String code) {
        VerificationEntry entry = codeStore.get(email);
        if (entry == null) return false;
        boolean valid = entry.isValid(code);
        if (valid) {
            codeStore.remove(email); // Invalider après usage unique
        }
        return valid;
    }

    /**
     * Supprime le code stocké (ex: annulation).
     */
    public void invalidateCode(String email) {
        codeStore.remove(email);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }
}
