package com.mybalance.budget;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class BudgetScheduler {

    private final UserRepository userRepository;
    private final BudgetModelRepository budgetModelRepository;
    private final BudgetModelItemRepository budgetModelItemRepository;
    private final MonthlyBudgetRepository monthlyBudgetRepository;
    private final MonthlyBudgetItemRepository monthlyBudgetItemRepository;

    /**
     * Tarea programada para ejecutarse a la medianoche del primer día de cada mes.
     * Genera automáticamente los presupuestos mensuales de todos los usuarios basados en sus plantillas.
     */
    @Scheduled(cron = "0 0 0 1 * *")
    public void generateMonthlyBudgetsFromTemplates() {
        log.info("Iniciando tarea programada: Generación automática de presupuestos mensuales.");
        
        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int year = today.getYear();

        List<User> users = userRepository.findAll();
        log.info("Se encontraron {} usuarios registrados para procesar.", users.size());

        for (User user : users) {
            try {
                processUserBudget(user, month, year);
            } catch (Exception e) {
                log.error("Error al procesar el presupuesto mensual para el usuario: {}", user.getEmail(), e);
            }
        }

        log.info("Tarea programada de generación de presupuestos mensuales finalizada.");
    }

    @Transactional
    public void processUserBudget(User user, int month, int year) {
        // Verificar si ya existe un presupuesto mensual
        Optional<MonthlyBudget> existingBudget = monthlyBudgetRepository
                .findByUserEmailAndMonthAndYear(user.getEmail(), month, year);

        if (existingBudget.isPresent()) {
            log.debug("El presupuesto mensual ya existe para el usuario {} en el mes {}/{}", 
                    user.getEmail(), month, year);
            return;
        }

        // Buscar si el usuario tiene una plantilla configurada
        Optional<BudgetModel> budgetModelOpt = budgetModelRepository.findByUserEmail(user.getEmail());

        if (budgetModelOpt.isPresent()) {
            BudgetModel model = budgetModelOpt.get();
            
            // Crear el presupuesto mensual
            MonthlyBudget monthlyBudget = MonthlyBudget.builder()
                    .user(user)
                    .month(month)
                    .year(year)
                    .totalLimit(model.getTotalLimit())
                    .percentVida(model.getPercentVida())
                    .percentOcio(model.getPercentOcio())
                    .percentInversionDeuda(model.getPercentInversionDeuda())
                    .build();

            monthlyBudget = monthlyBudgetRepository.save(monthlyBudget);

            // Copiar ítems de presupuesto
            List<BudgetModelItem> modelItems = budgetModelItemRepository
                    .findByBudgetModelId(model.getId());

            for (BudgetModelItem modelItem : modelItems) {
                Integer dueDay = modelItem.getDueDay();
                LocalDate dueDate = null;
                if (dueDay != null) {
                    int lastDayOfMonth = java.time.YearMonth.of(year, month).lengthOfMonth();
                    int resolvedDay = Math.min(dueDay, lastDayOfMonth);
                    dueDate = LocalDate.of(year, month, resolvedDay);
                }

                MonthlyBudgetItem monthlyItem = MonthlyBudgetItem.builder()
                        .monthlyBudget(monthlyBudget)
                        .name(modelItem.getName())
                        .category(modelItem.getCategory())
                        .amountLimit(modelItem.getAmountLimit())
                        .dueDay(dueDay)
                        .dueDate(dueDate)
                        .paid(false)
                        .build();
                
                monthlyBudgetItemRepository.save(monthlyItem);
            }

            log.info("Presupuesto automático creado con éxito para el usuario {} en el período {}/{} con límite global de {}", 
                    user.getEmail(), month, year, model.getTotalLimit());
        }
    }
}
