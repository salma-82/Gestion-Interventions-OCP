package com.ocp.intervention.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum PrioriteTicket {
    URGENT("URGENT", "HIGH"),
    MOYENNE("MOYENNE", "MEDIUM"),
    NORMALE("NORMALE", "LOW");

    private final String label;
    private final String apiAlias;

    PrioriteTicket(String label, String apiAlias) {
        this.label = label;
        this.apiAlias = apiAlias;
    }

    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static PrioriteTicket fromValue(String value) {
        if (value == null) {
            return null;
        }

        for (PrioriteTicket priorite : values()) {
            if (priorite.name().equalsIgnoreCase(value) || priorite.apiAlias.equalsIgnoreCase(value)) {
                return priorite;
            }
        }

        throw new IllegalArgumentException("PrioriteTicket inconnue: " + value);
    }
}
