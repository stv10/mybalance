package com.mybalance.report;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.shared.exception.ResourceNotFoundException;
import com.mybalance.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class AiReportController {

    private final ReportGeneratorService reportGeneratorService;
    private final UserRepository userRepository;

    /**
     * Obtiene el último informe de IA generado para el usuario.
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<AiReportResponse>> getLatestReport(
            @AuthenticationPrincipal String email) {
        try {
            AiReportResponse response = reportGeneratorService.getLatestMonthlyReport(email);
            return ResponseEntity.ok(ApiResponse.ok(response));
        } catch (ResourceNotFoundException e) {
            // Si el usuario no tiene ningún informe aún, devolvemos data = null
            // para que el frontend maneje el estado vacío de manera elegante.
            return ResponseEntity.ok(ApiResponse.ok("No se encontraron informes para el usuario.", null));
        }
    }

    /**
     * Obtiene el historial completo de informes de IA generados para el usuario.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AiReportResponse>>> getReportHistory(
            @AuthenticationPrincipal String email) {
        List<AiReportResponse> history = reportGeneratorService.getReportHistory(email);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    /**
     * Genera manualmente un informe para el periodo y tipo seleccionados.
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<AiReportResponse>> generateReport(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String period,
            @RequestParam(defaultValue = "false") boolean forceRecalculate,
            @AuthenticationPrincipal String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        ReportType reportType;
        try {
            reportType = type != null ? ReportType.valueOf(type.toUpperCase()) : ReportType.MONTHLY;
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tipo de reporte inválido. Debe ser MONTHLY, SEMESTRAL o ANNUAL."));
        }

        LocalDate today = LocalDate.now();
        String targetPeriod = period;

        if (targetPeriod == null || targetPeriod.trim().isEmpty()) {
            if (reportType == ReportType.MONTHLY) {
                targetPeriod = String.format("%d-%02d", today.getYear(), today.getMonthValue());
            } else if (reportType == ReportType.SEMESTRAL) {
                String sem = today.getMonthValue() <= 6 ? "S1" : "S2";
                targetPeriod = String.format("%d-%s", today.getYear(), sem);
            } else {
                targetPeriod = String.valueOf(today.getYear());
            }
        } else {
            targetPeriod = targetPeriod.trim();
        }

        // Validar formato e impedir periodos futuros
        try {
            if (reportType == ReportType.MONTHLY) {
                if (!targetPeriod.matches("^\\d{4}-\\d{2}$")) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("El periodo mensual debe tener el formato YYYY-MM."));
                }
                String[] parts = targetPeriod.split("-");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                if (month < 1 || month > 12) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("Mes inválido en el periodo."));
                }
                LocalDate requestedDate = LocalDate.of(year, month, 1);
                if (requestedDate.isAfter(today.withDayOfMonth(1))) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("No es posible generar reportes para períodos futuros."));
                }
            } else if (reportType == ReportType.SEMESTRAL) {
                if (!targetPeriod.matches("^\\d{4}-S[12]$")) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("El periodo semestral debe tener el formato YYYY-S1 o YYYY-S2."));
                }
                String[] parts = targetPeriod.split("-");
                int year = Integer.parseInt(parts[0]);
                String sem = parts[1];
                if (year > today.getYear()) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("No es posible generar reportes para períodos futuros."));
                } else if (year == today.getYear()) {
                    int currentMonth = today.getMonthValue();
                    if (sem.equals("S2") && currentMonth <= 6) {
                        return ResponseEntity.badRequest().body(ApiResponse.error("No es posible generar reportes para períodos futuros."));
                    }
                }
            } else if (reportType == ReportType.ANNUAL) {
                if (!targetPeriod.matches("^\\d{4}$")) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("El periodo anual debe tener el formato YYYY."));
                }
                int year = Integer.parseInt(targetPeriod);
                if (year > today.getYear()) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("No es posible generar reportes para períodos futuros."));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al validar el periodo."));
        }

        AiReportResponse report = reportGeneratorService.generateAndSaveReport(
                user, targetPeriod, reportType, forceRecalculate);

        return ResponseEntity.ok(ApiResponse.ok("Reporte de IA generado exitosamente", report));
    }
}
