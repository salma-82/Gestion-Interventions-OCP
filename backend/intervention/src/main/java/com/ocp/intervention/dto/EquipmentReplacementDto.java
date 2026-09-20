package com.ocp.intervention.dto;

public class EquipmentReplacementDto {
    private Long newEquipmentId;
    private String reason; // optional description of the reason for replacement

    public Long getNewEquipmentId() {
        return newEquipmentId;
    }

    public void setNewEquipmentId(Long newEquipmentId) {
        this.newEquipmentId = newEquipmentId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
