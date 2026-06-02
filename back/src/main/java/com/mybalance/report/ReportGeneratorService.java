package com.mybalance.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.shared.exception.ResourceNotFoundException;
import com.mybalance.transaction.Transaction;
import com.mybalance.transaction.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ReportGeneratorService {

    private final String apiKey;
    private final String model;
    private final AiReportRepository aiReportRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public ReportGeneratorService(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.model:gemini-2.5-flash}") String model,
            AiReportRepository aiReportRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.aiReportRepository = aiReportRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
        log.info("ReportGeneratorService inicializado. Clave API de Gemini detectada: {}", 
                (apiKey != null && !apiKey.trim().isEmpty()) ? "SÍ (longitud: " + apiKey.trim().length() + " caracteres)" : "NO (vacía o no configurada)");
    }

    // Constructor para pruebas unitarias
    ReportGeneratorService(
            String apiKey,
            String model,
            AiReportRepository aiReportRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.aiReportRepository = aiReportRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Recupera el reporte mensual de IA más reciente del usuario.
     */
    @Transactional(readOnly = true)
    public AiReportResponse getLatestMonthlyReport(String email) {
        AiReport report = aiReportRepository.findTopByUserEmailAndTypeOrderByPeriodDesc(email, ReportType.MONTHLY)
                .orElseThrow(() -> new ResourceNotFoundException("AiReport", email));
        return AiReportResponse.fromEntity(report);
    }

    /**
     * Obtiene todo el historial de reportes de IA del usuario.
     */
    @Transactional(readOnly = true)
    public List<AiReportResponse> getReportHistory(String email) {
        return aiReportRepository.findByUserEmailOrderByPeriodDesc(email).stream()
                .map(AiReportResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Genera y guarda un informe de IA del tipo y período seleccionados.
     */
    @Transactional
    public AiReportResponse generateAndSaveReport(User user, String period, ReportType type, boolean forceRecalculate) {
        log.info("Generando informe de IA de tipo {} para el usuario {} y periodo {}", type, user.getEmail(), period);

        // Si no se fuerza el recalculo, verificar si ya existe un informe guardado
        if (!forceRecalculate) {
            Optional<AiReport> existingReport = aiReportRepository.findByUserEmailAndPeriodAndType(
                    user.getEmail(), period, type);
            if (existingReport.isPresent()) {
                log.info("Se encontró un informe de IA previo y válido para {}. Devolviendo cache...", period);
                return AiReportResponse.fromEntity(existingReport.get());
            }
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new BusinessException("La clave API de Gemini no está configurada. Por favor configúrala como 'gemini.api.key'.");
        }

        String systemInstruction = 
                "Eres un analista financiero experto, empático e inteligente. Tu tarea es analizar los datos financieros del usuario y devolver un informe exclusivamente en formato JSON estructurado.\n" +
                "El JSON debe tener exactamente esta estructura:\n" +
                "{\n" +
                "  \"resumen\": \"(String) Máximo 1 frase corta sobre la salud general de las finanzas en este periodo. Debe explicar detalladamente el por qué del score asignado, sin repetir los números que el usuario ya ve en las gráficas.\",\n" +
                "  \"acciones\": [\n" +
                "    \"(String) Punto de acción concreto 1 (ej: 'Reduce 5% en delivery')\",\n" +
                "    \"(String) Punto de acción concreto 2\",\n" +
                "    \"(String) Punto de acción concreto 3\"\n" +
                "  ],\n" +
                "  \"alerta\": \"(String o null) Si detectas una anomalía crítica en el consumo, descríbela en una frase corta. Si no, pon null.\",\n" +
                "  \"score\": (Integer de 1 a 100) Un puntaje de salud financiera (1-100) basado en su tasa de ahorro, cumplimiento de presupuesto y estabilidad.\n" +
                "}\n" +
                "Devuelve EXCLUSIVAMENTE el objeto JSON sin envoltorios de Markdown de código (sin ```json) ni texto adicional. Tu respuesta debe ser parseable directamente por Jackson ObjectMapper. Sé cercano y profesional en español latino.";

        String dataPayload = "";

        if (type == ReportType.MONTHLY) {
            dataPayload = buildMonthlyPayload(user.getEmail(), period);
        } else if (type == ReportType.SEMESTRAL) {
            dataPayload = buildSemestralPayload(user.getEmail(), period);
        } else if (type == ReportType.ANNUAL) {
            dataPayload = buildAnnualPayload(user.getEmail(), period);
        }

        // Configurar payload para Gemini API con responseMimeType
        Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");
        Map<String, Object> requestPayload = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", dataPayload)
                                )
                        )
                ),
                "systemInstruction", Map.of(
                        "parts", List.of(
                                Map.of("text", systemInstruction)
                        )
                ),
                "generationConfig", generationConfig
        );

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

        try {
            log.info("Enviando petición a Gemini para informe de tipo {} y periodo {}", type, period);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            String body = response.getBody();

            if (body == null || body.trim().isEmpty()) {
                throw new BusinessException("Respuesta vacía recibida desde la API de Gemini al generar informe.");
            }

            String aiContent = extractTextContent(body);
            
            // Validar que sea un JSON válido
            try {
                objectMapper.readTree(aiContent);
            } catch (Exception e) {
                log.warn("La respuesta de Gemini no es un JSON limpio, intentando extraer o lanzar error: {}", aiContent);
                // Si viene envuelto en markdown ```json ... ```, lo limpiamos
                if (aiContent.contains("```")) {
                    aiContent = aiContent.replaceAll("```json|```", "").trim();
                    objectMapper.readTree(aiContent); // Revalidar
                } else {
                    throw new BusinessException("La respuesta de Gemini no contiene un formato JSON válido.");
                }
            }

            // Persistir o actualizar el reporte en base de datos
            Optional<AiReport> optReport = aiReportRepository.findByUserEmailAndPeriodAndType(
                    user.getEmail(), period, type);
            
            AiReport aiReport;
            if (optReport.isPresent()) {
                aiReport = optReport.get();
                aiReport.setContent(aiContent);
            } else {
                aiReport = AiReport.builder()
                        .user(user)
                        .period(period)
                        .type(type)
                        .content(aiContent)
                        .build();
            }

            aiReport = aiReportRepository.save(aiReport);
            log.info("Informe {} de IA guardado exitosamente para el período {}", type, period);

            return AiReportResponse.fromEntity(aiReport);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error llamando a la API de Gemini para informes financieros: {}", e.getMessage(), e);
            throw new BusinessException("Error al procesar el informe inteligente con Gemini. Inténtalo de nuevo en unos minutos.");
        }
    }

    private String buildMonthlyPayload(String email, String period) {
        String[] parts = period.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.with(TemporalAdjusters.lastDayOfMonth());

        // 1. Recuperar transacciones del periodo
        List<Transaction> transactions = transactionRepository.findByAccountUserEmailAndDateBetween(
                email, startDate, endDate);

        if (transactions.isEmpty()) {
            throw new BusinessException("No tienes transacciones registradas en el período " + period + " para realizar un informe de IA.");
        }

        // 2. Procesar datos agregados del mes actual
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        Map<String, BigDecimal> expensesByCategory = new HashMap<>();

        for (Transaction tx : transactions) {
            if (tx.getType() == CategoryType.INCOME) {
                totalIncome = totalIncome.add(tx.getAmount());
            } else if (tx.getType() == CategoryType.EXPENSE) {
                totalExpense = totalExpense.add(tx.getAmount());
                String categoryName = tx.getCategory() != null ? tx.getCategory().getName() : "Otros";
                expensesByCategory.put(categoryName, expensesByCategory.getOrDefault(categoryName, BigDecimal.ZERO).add(tx.getAmount()));
            }
        }

        BigDecimal netSavings = totalIncome.subtract(totalExpense);
        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netSavings.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP);
        }

        // 3. Hyper-Personalización: Obtener historial de 3 meses anteriores
        LocalDate histStartDate = startDate.minusMonths(3);
        LocalDate histEndDate = startDate.minusDays(1);
        List<Transaction> histTransactions = transactionRepository.findByAccountUserEmailAndDateBetween(
                email, histStartDate, histEndDate);

        // Agrupar por mes en el historial
        BigDecimal histTotalIncome = BigDecimal.ZERO;
        BigDecimal histTotalExpense = BigDecimal.ZERO;
        Map<String, BigDecimal> histExpensesByCategory = new HashMap<>();
        Set<String> histMonths = new HashSet<>();

        for (Transaction tx : histTransactions) {
            LocalDate date = tx.getDate();
            String monthKey = String.format("%d-%02d", date.getYear(), date.getMonthValue());
            histMonths.add(monthKey);

            if (tx.getType() == CategoryType.INCOME) {
                histTotalIncome = histTotalIncome.add(tx.getAmount());
            } else if (tx.getType() == CategoryType.EXPENSE) {
                histTotalExpense = histTotalExpense.add(tx.getAmount());
                String categoryName = tx.getCategory() != null ? tx.getCategory().getName() : "Otros";
                histExpensesByCategory.put(categoryName, histExpensesByCategory.getOrDefault(categoryName, BigDecimal.ZERO).add(tx.getAmount()));
            }
        }

        int monthsDivider = Math.max(1, histMonths.size());
        BigDecimal avgHistIncome = histTotalIncome.divide(BigDecimal.valueOf(monthsDivider), 2, RoundingMode.HALF_UP);
        BigDecimal avgHistExpense = histTotalExpense.divide(BigDecimal.valueOf(monthsDivider), 2, RoundingMode.HALF_UP);

        // Desglose de gastos mes actual vs promedio anterior
        StringBuilder comparisonText = new StringBuilder();
        expensesByCategory.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(entry -> {
                    String catName = entry.getKey();
                    BigDecimal currentAmt = entry.getValue();
                    BigDecimal histTotalCat = histExpensesByCategory.getOrDefault(catName, BigDecimal.ZERO);
                    BigDecimal histAvgCat = histTotalCat.divide(BigDecimal.valueOf(monthsDivider), 2, RoundingMode.HALF_UP);
                    
                    comparisonText.append(String.format("  - %s: Actual $%s, Promedio 3 meses anteriores: $%s",
                            catName, currentAmt.setScale(2, RoundingMode.HALF_UP), histAvgCat.setScale(2, RoundingMode.HALF_UP)));
                    
                    if (histAvgCat.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal diff = currentAmt.subtract(histAvgCat);
                        BigDecimal diffPct = diff.multiply(BigDecimal.valueOf(100)).divide(histAvgCat, 2, RoundingMode.HALF_UP);
                        String direction = diff.compareTo(BigDecimal.ZERO) > 0 ? "mayor" : "menor";
                        comparisonText.append(String.format(" (un %s%% %s)\n", diffPct.abs().setScale(1, RoundingMode.HALF_UP), direction));
                    } else {
                        comparisonText.append(" (Nueva categoría de gasto)\n");
                    }
                });

        return String.format(
                "Datos Financieros del Período Mensual [%s]:\n" +
                "- Ingresos del mes: $%s (Promedio de los últimos 3 meses: $%s)\n" +
                "- Gastos del mes: $%s (Promedio de los últimos 3 meses: $%s)\n" +
                "- Ahorro Neto del mes: $%s\n" +
                "- Tasa de Ahorro del mes: %s%%\n" +
                "- Historial de Comparación de Gastos por Categoría:\n%s",
                period,
                totalIncome.setScale(2, RoundingMode.HALF_UP), avgHistIncome.setScale(2, RoundingMode.HALF_UP),
                totalExpense.setScale(2, RoundingMode.HALF_UP), avgHistExpense.setScale(2, RoundingMode.HALF_UP),
                netSavings.setScale(2, RoundingMode.HALF_UP),
                savingsRate.setScale(2, RoundingMode.HALF_UP),
                comparisonText.toString()
        );
    }

    private String buildSemestralPayload(String email, String period) {
        String[] parts = period.split("-");
        int year = Integer.parseInt(parts[0]);
        String sem = parts[1]; // S1 o S2

        int startMonth = sem.equals("S1") ? 1 : 7;
        int endMonth = sem.equals("S1") ? 6 : 12;

        LocalDate startDate = LocalDate.of(year, startMonth, 1);
        LocalDate endDate = LocalDate.of(year, endMonth, 1).with(TemporalAdjusters.lastDayOfMonth());

        List<Transaction> transactions = transactionRepository.findByAccountUserEmailAndDateBetween(
                email, startDate, endDate);

        if (transactions.isEmpty()) {
            throw new BusinessException("No tienes transacciones registradas en el período " + period + " para realizar un informe de IA.");
        }

        // Agrupar datos mes a mes (ej: 1 al 6 o 7 al 12)
        Map<Integer, BigDecimal> monthlyIncomes = new HashMap<>();
        Map<Integer, BigDecimal> monthlyExpenses = new HashMap<>();
        Map<String, BigDecimal> categoryTotals = new HashMap<>();

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            LocalDate date = tx.getDate();
            int m = date.getMonthValue();

            if (tx.getType() == CategoryType.INCOME) {
                monthlyIncomes.put(m, monthlyIncomes.getOrDefault(m, BigDecimal.ZERO).add(tx.getAmount()));
                totalIncome = totalIncome.add(tx.getAmount());
            } else if (tx.getType() == CategoryType.EXPENSE) {
                monthlyExpenses.put(m, monthlyExpenses.getOrDefault(m, BigDecimal.ZERO).add(tx.getAmount()));
                totalExpense = totalExpense.add(tx.getAmount());
                String categoryName = tx.getCategory() != null ? tx.getCategory().getName() : "Otros";
                categoryTotals.put(categoryName, categoryTotals.getOrDefault(categoryName, BigDecimal.ZERO).add(tx.getAmount()));
            }
        }

        StringBuilder monthlyEvolution = new StringBuilder();
        for (int m = startMonth; m <= endMonth; m++) {
            BigDecimal inc = monthlyIncomes.getOrDefault(m, BigDecimal.ZERO);
            BigDecimal exp = monthlyExpenses.getOrDefault(m, BigDecimal.ZERO);
            BigDecimal sav = inc.subtract(exp);
            BigDecimal rate = BigDecimal.ZERO;
            if (inc.compareTo(BigDecimal.ZERO) > 0) {
                rate = sav.multiply(BigDecimal.valueOf(100)).divide(inc, 2, RoundingMode.HALF_UP);
            }
            monthlyEvolution.append(String.format("  - Mes %d: Ingresos $%s, Gastos $%s, Ahorro Neto $%s (Tasa de ahorro: %s%%)\n",
                    m, inc.setScale(2, RoundingMode.HALF_UP), exp.setScale(2, RoundingMode.HALF_UP), sav.setScale(2, RoundingMode.HALF_UP), rate.setScale(2, RoundingMode.HALF_UP)));
        }

        StringBuilder categoryBreakdown = new StringBuilder();
        categoryTotals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(entry -> categoryBreakdown.append(String.format("  - %s: $%s\n", entry.getKey(), entry.getValue().setScale(2, RoundingMode.HALF_UP))));

        BigDecimal totalSavings = totalIncome.subtract(totalExpense);
        BigDecimal totalSavingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            totalSavingsRate = totalSavings.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP);
        }

        return String.format(
                "Datos Financieros del Período Semestral [%s]:\n" +
                "- Ingresos Totales del Semestre: $%s\n" +
                "- Gastos Totales del Semestre: $%s\n" +
                "- Ahorro Neto Total: $%s (Tasa global: %s%%)\n" +
                "- Evolución Mensual del Semestre:\n%s" +
                "- Desglose de Gastos Semestrales por Categoría:\n%s",
                period,
                totalIncome.setScale(2, RoundingMode.HALF_UP),
                totalExpense.setScale(2, RoundingMode.HALF_UP),
                totalSavings.setScale(2, RoundingMode.HALF_UP),
                totalSavingsRate.setScale(2, RoundingMode.HALF_UP),
                monthlyEvolution.toString(),
                categoryBreakdown.toString()
        );
    }

    private String buildAnnualPayload(String email, String period) {
        int year = Integer.parseInt(period);

        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);

        List<Transaction> transactions = transactionRepository.findByAccountUserEmailAndDateBetween(
                email, startDate, endDate);

        if (transactions.isEmpty()) {
            throw new BusinessException("No tienes transacciones registradas en el período " + period + " para realizar un informe de IA.");
        }

        // Agrupar por semestres (S1: meses 1-6, S2: meses 7-12)
        BigDecimal s1Income = BigDecimal.ZERO;
        BigDecimal s1Expense = BigDecimal.ZERO;
        BigDecimal s2Income = BigDecimal.ZERO;
        BigDecimal s2Expense = BigDecimal.ZERO;

        Map<String, BigDecimal> categoryTotals = new HashMap<>();
        Map<Integer, BigDecimal> monthlyExpenses = new HashMap<>();

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            LocalDate date = tx.getDate();
            int m = date.getMonthValue();

            if (tx.getType() == CategoryType.INCOME) {
                totalIncome = totalIncome.add(tx.getAmount());
                if (m <= 6) {
                    s1Income = s1Income.add(tx.getAmount());
                } else {
                    s2Income = s2Income.add(tx.getAmount());
                }
            } else if (tx.getType() == CategoryType.EXPENSE) {
                totalExpense = totalExpense.add(tx.getAmount());
                monthlyExpenses.put(m, monthlyExpenses.getOrDefault(m, BigDecimal.ZERO).add(tx.getAmount()));
                
                if (m <= 6) {
                    s1Expense = s1Expense.add(tx.getAmount());
                } else {
                    s2Expense = s2Expense.add(tx.getAmount());
                }

                String categoryName = tx.getCategory() != null ? tx.getCategory().getName() : "Otros";
                categoryTotals.put(categoryName, categoryTotals.getOrDefault(categoryName, BigDecimal.ZERO).add(tx.getAmount()));
            }
        }

        // Calcular peores meses
        int worstExpenseMonth = 1;
        BigDecimal maxExpense = BigDecimal.ZERO;

        for (int m = 1; m <= 12; m++) {
            BigDecimal exp = monthlyExpenses.getOrDefault(m, BigDecimal.ZERO);
            if (exp.compareTo(maxExpense) > 0) {
                maxExpense = exp;
                worstExpenseMonth = m;
            }
        }

        BigDecimal totalSavings = totalIncome.subtract(totalExpense);
        BigDecimal totalSavingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            totalSavingsRate = totalSavings.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP);
        }

        BigDecimal s1Savings = s1Income.subtract(s1Expense);
        BigDecimal s2Savings = s2Income.subtract(s2Expense);

        StringBuilder categoryBreakdown = new StringBuilder();
        categoryTotals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(entry -> categoryBreakdown.append(String.format("  - %s: $%s\n", entry.getKey(), entry.getValue().setScale(2, RoundingMode.HALF_UP))));

        return String.format(
                "Datos Financieros del Período Anual [%s]:\n" +
                "- Ingresos Totales del Año: $%s\n" +
                "- Gastos Totales del Año: $%s\n" +
                "- Ahorro Neto Total del Año: $%s (Tasa global: %s%%)\n" +
                "- Rendimiento por Semestres:\n" +
                "  * Primer Semestre (S1): Ingresos $%s, Gastos $%s, Ahorro Neto $%s\n" +
                "  * Segundo Semestre (S2): Ingresos $%s, Gastos $%s, Ahorro Neto $%s\n" +
                "- Meses Destacados:\n" +
                "  * Mes de mayor gasto total: Mes %d ($%s)\n" +
                "- Desglose de Gastos Anuales por Categoría:\n%s",
                period,
                totalIncome.setScale(2, RoundingMode.HALF_UP),
                totalExpense.setScale(2, RoundingMode.HALF_UP),
                totalSavings.setScale(2, RoundingMode.HALF_UP),
                totalSavingsRate.setScale(2, RoundingMode.HALF_UP),
                s1Income.setScale(2, RoundingMode.HALF_UP), s1Expense.setScale(2, RoundingMode.HALF_UP), s1Savings.setScale(2, RoundingMode.HALF_UP),
                s2Income.setScale(2, RoundingMode.HALF_UP), s2Expense.setScale(2, RoundingMode.HALF_UP), s2Savings.setScale(2, RoundingMode.HALF_UP),
                worstExpenseMonth, maxExpense.setScale(2, RoundingMode.HALF_UP),
                categoryBreakdown.toString()
        );
    }

    /**
     * Auxiliar para extraer el texto devuelto en el JSON de Gemini.
     */
    private String extractTextContent(String body) throws Exception {
        Map<?, ?> rootMap = objectMapper.readValue(body, Map.class);
        List<?> candidates = (List<?>) rootMap.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new BusinessException("No se obtuvieron candidatos válidos de Gemini.");
        }

        Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
        Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
        if (content == null) {
            throw new BusinessException("Contenido ausente en el candidato.");
        }

        List<?> parts = (List<?>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new BusinessException("Partes ausentes en la respuesta de Gemini.");
        }

        Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
        String text = (String) firstPart.get("text");
        if (text == null || text.trim().isEmpty()) {
            throw new BusinessException("El texto del reporte está vacío en la respuesta.");
        }

        return text.trim();
    }
}
