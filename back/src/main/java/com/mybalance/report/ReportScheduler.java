package com.mybalance.report;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@Slf4j
public class ReportScheduler {

    private final UserRepository userRepository;
    private final ReportGeneratorService reportGeneratorService;
    private final ExecutorService reportExecutor;

    @Autowired
    public ReportScheduler(UserRepository userRepository, ReportGeneratorService reportGeneratorService) {
        this.userRepository = userRepository;
        this.reportGeneratorService = reportGeneratorService;
        this.reportExecutor = Executors.newSingleThreadExecutor();
    }

    /**
     * Tarea programada principal. Se ejecuta el día 1 de cada mes a la 01:00 AM.
     * Recupera todos los usuarios y programa la generación asíncrona secuencial.
     */
    @Scheduled(cron = "0 0 1 1 * *")
    public void generateMonthlyAiReports() {
        log.info("Iniciando tarea programada: Generación diferida de reportes de IA para todos los usuarios.");

        LocalDate today = LocalDate.now();
        // Obtener el mes anterior
        LocalDate previousMonthDate = today.minusMonths(1);
        int month = previousMonthDate.getMonthValue();
        int year = previousMonthDate.getYear();
        String period = String.format("%d-%02d", year, month);

        List<User> users = userRepository.findAll();
        log.info("Se encontraron {} usuarios registrados. Delegando ejecución secuencial al hilo de fondo...", users.size());

        // Enviar a ejecución asíncrona secuencial
        reportExecutor.submit(() -> {
            for (int i = 0; i < users.size(); i++) {
                User user = users.get(i);
                
                // Si no es el primer usuario, aplicar sleep de 5 minutos (300,000 ms) para proteger la API
                if (i > 0) {
                    try {
                        log.info("Esperando 5 minutos (300000ms) antes de generar el reporte de IA para el siguiente usuario...");
                        Thread.sleep(300000);
                    } catch (InterruptedException e) {
                        log.warn("El hilo de espera del programador de reportes de IA fue interrumpido.", e);
                        Thread.currentThread().interrupt();
                        break;
                    }
                }

                try {
                    log.info("Procesando reporte mensual de IA de {} para el usuario: {}", period, user.getEmail());
                    reportGeneratorService.generateAndSaveReport(user, period, ReportType.MONTHLY, false);
                } catch (Exception e) {
                    log.error("Error al generar automáticamente el reporte mensual de IA para el usuario: {}", user.getEmail(), e);
                }
            }
            log.info("Procesamiento en segundo plano de todos los reportes de IA mensuales finalizado.");
        });

        log.info("Hebra programadora principal liberada. El procesamiento secuencial continúa asíncronamente en segundo plano.");
    }

    /**
     * Apagar de forma segura el pool de hilos al cerrar la aplicación.
     */
    @PreDestroy
    public void shutdownExecutor() {
        log.info("Apagando pool de hilos secuenciales del programador de reportes de IA...");
        reportExecutor.shutdown();
        try {
            if (!reportExecutor.awaitTermination(60, java.util.concurrent.TimeUnit.SECONDS)) {
                reportExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            reportExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        log.info("Pool de hilos secuenciales del programador apagado.");
    }
}
