package com.ocp.intervention.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for OTP verification code expiry.
 * <p>
 * Binds the property <code>app.verification.code.expiry-minutes</code> defined in
 * <code>application.properties</code>. This property controls how many minutes a
 * verification code remains valid.
 */
@Component
@ConfigurationProperties(prefix = "app.verification.code")
public class VerificationProperties {
    /** Expiry time of the verification code in minutes. */
    private int expiryMinutes = 10;

    public int getExpiryMinutes() {
        return expiryMinutes;
    }

    public void setExpiryMinutes(int expiryMinutes) {
        this.expiryMinutes = expiryMinutes;
    }
}
