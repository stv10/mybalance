package com.mybalance.report;

import java.time.LocalDateTime;
import java.util.UUID;

public record AiReportResponse(
    UUID id,
    String period,
    String type,
    String content,
    LocalDateTime createdAt
) {
    public static AiReportResponse fromEntity(AiReport entity) {
        return new AiReportResponse(
            entity.getId(),
            entity.getPeriod(),
            entity.getType().name(),
            entity.getContent(),
            entity.getCreatedAt()
        );
    }
}
