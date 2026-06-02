package com.mybalance.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiReportRepository extends JpaRepository<AiReport, UUID> {
    
    Optional<AiReport> findTopByUserEmailAndTypeOrderByPeriodDesc(String email, ReportType type);
    
    List<AiReport> findByUserEmailOrderByPeriodDesc(String email);
    
    Optional<AiReport> findByUserEmailAndPeriodAndType(String email, String period, ReportType type);
}
