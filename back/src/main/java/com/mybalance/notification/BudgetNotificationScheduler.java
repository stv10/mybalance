package com.mybalance.notification;

import com.mybalance.auth.User;
import com.mybalance.budget.MonthlyBudgetItem;
import com.mybalance.budget.MonthlyBudgetItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class BudgetNotificationScheduler {

    private final MonthlyBudgetItemRepository monthlyBudgetItemRepository;
    private final EmailService emailService;

    /**
     * Tarea programada para ejecutarse todos los días a las 7:00 AM.
     * Busca ítems de presupuesto que vencen hoy y notifica a los usuarios por correo.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @Transactional(readOnly = true)
    public void notifyDueBudgetItems() {
        log.info("Iniciando tarea programada: Notificación de vencimiento de ítems del presupuesto.");

        LocalDate today = LocalDate.now();
        List<MonthlyBudgetItem> itemsDueToday = monthlyBudgetItemRepository.findByPaidFalseAndDueDate(today);

        if (itemsDueToday.isEmpty()) {
            log.info("No hay ítems de presupuesto que venzan hoy ({}).", today);
            return;
        }

        // Agrupar los ítems por usuario para enviar un solo correo consolidado
        Map<User, List<MonthlyBudgetItem>> itemsByUser = itemsDueToday.stream()
                .collect(Collectors.groupingBy(item -> item.getMonthlyBudget().getUser()));

        log.info("Se encontraron {} usuarios con ítems que vencen hoy para notificar.", itemsByUser.size());

        for (Map.Entry<User, List<MonthlyBudgetItem>> entry : itemsByUser.entrySet()) {
            User user = entry.getKey();
            List<MonthlyBudgetItem> userItems = entry.getValue();

            try {
                sendConsolidatedNotification(user, userItems, today);
            } catch (Exception e) {
                log.error("Error al enviar notificación de vencimiento al usuario: {}", user.getEmail(), e);
            }
        }

        log.info("Tarea programada de notificación de vencimiento finalizada.");
    }

    private void sendConsolidatedNotification(User user, List<MonthlyBudgetItem> items, LocalDate today) {
        String subject = "📅 Recordatorio de Vencimiento — MyBalance";

        StringBuilder body = new StringBuilder();
        body.append("Hola ").append(user.getName()).append(",\n\n");
        body.append("Te recordamos que hoy (").append(today.toString()).append(") vencen los siguientes ítems de tu presupuesto que aún tienes pendientes:\n\n");

        for (MonthlyBudgetItem item : items) {
            body.append("• ").append(item.getName())
                    .append(" — Límite sugerido: $").append(item.getAmountLimit())
                    .append(" (Categoría: ").append(item.getCategory().getName()).append(")\n");
        }

        body.append("\nPuedes ingresar a MyBalance para registrar el pago de estos ítems y mantener tus finanzas al día.\n\n");
        body.append("Saludos,\n");
        body.append("El equipo de MyBalance");

        emailService.sendEmail(user.getEmail(), subject, body.toString());
    }
}
