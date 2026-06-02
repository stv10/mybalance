package com.mybalance.infrastructure.bot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import com.mybalance.auth.User;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.infrastructure.bot.dto.AiTransactionResult;
import com.mybalance.shared.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TransactionAiParserService {

    private static final Logger log = LoggerFactory.getLogger(TransactionAiParserService.class);

    private final String apiKey;
    private final String model;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public TransactionAiParserService(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.model:gemini-2.5-flash}") String model,
            CategoryRepository categoryRepository,
            AccountRepository accountRepository,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
        log.info("TransactionAiParserService inicializado. Clave API de Gemini detectada: {}", 
                (apiKey != null && !apiKey.trim().isEmpty()) ? "SÍ (longitud: " + apiKey.trim().length() + " caracteres)" : "NO (vacía o no configurada)");
    }

    // Constructor package-private para pruebas unitarias
    TransactionAiParserService(
            String apiKey,
            String model,
            CategoryRepository categoryRepository,
            AccountRepository accountRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public AiTransactionResult parseTransaction(String text, User user) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new BusinessException("La clave API de Gemini no está configurada. Por favor configúrala como 'gemini.api.key'.");
        }

        // 1. Obtener categorías y cuentas del usuario
        List<Category> categories = categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail());
        List<Account> accounts = accountRepository.findByUserEmailOrderByNameAsc(user.getEmail());

        String categoriesStr = categories.stream()
                .map(Category::getName)
                .collect(Collectors.joining(", "));

        String accountsStr = accounts.stream()
                .map(Account::getName)
                .collect(Collectors.joining(", "));

        String firstAccount = accounts.isEmpty() ? "Principal" : accounts.get(0).getName();

        // 2. Construir la system instruction
        String systemInstruction = String.format(
                "Eres un asistente financiero experto en procesamiento de transacciones. Tu tarea es extraer la información financiera del texto que te envíe el usuario.\n" +
                "Debes devolver ÚNICAMENTE un objeto JSON válido. No incluyas explicaciones, no uses bloques de código markdown, solo devuelve el JSON puro.\n\n" +
                "Reglas críticas:\n" +
                "1. Las categorías disponibles y permitidas del usuario son: [%s]. Si el texto del usuario se asocia o coincide con alguna de ellas, usa EXACTAMENTE su nombre en la clave 'categoryName'. Si ninguna se asocia, sugiere una nueva categoría muy corta (máximo 1 o 2 palabras, ej: 'Sushi', 'Gimnasio', 'Luz').\n" +
                "2. Las cuentas disponibles y permitidas del usuario son: [%s]. Si el texto del usuario sugiere alguna cuenta, usa EXACTAMENTE su nombre en la clave 'accountName'. Si no se menciona o no coincide con ninguna, usa como fallback: '%s'.\n" +
                "3. El tipo de transacción ('type') debe ser estrictamente uno de los siguientes:\n" +
                "   - 'INCOME' si el texto indica una entrada, ingreso de dinero, cobro, depósito, sueldo, transferencia recibida, ganancia.\n" +
                "   - 'EXPENSE' si el texto indica una salida, gasto, pago, compra, pérdida, retiro, transferencia enviada.\n" +
                "4. El monto ('amount') debe ser un número decimal. Si no se puede deducir el monto de ninguna manera, el valor debe ser nulo.\n\n" +
                "El JSON debe tener exactamente estas llaves:\n" +
                "{\n" +
                "  \"amount\": número,\n" +
                "  \"type\": \"INCOME\" o \"EXPENSE\",\n" +
                "  \"categoryName\": \"Nombre de la categoría\" (string),\n" +
                "  \"accountName\": \"Nombre de la cuenta\" (string)\n" +
                "}",
                categoriesStr, accountsStr, firstAccount
        );

        // 3. Construir payload para Gemini API
        Map<String, Object> requestPayload = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", text)
                                )
                        )
                ),
                "systemInstruction", Map.of(
                        "parts", List.of(
                                Map.of("text", systemInstruction)
                        )
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json"
                )
        );

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

        try {
            log.info("Enviando petición a Gemini API para el texto: '{}'", text);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            String body = response.getBody();

            if (body == null || body.trim().isEmpty()) {
                throw new BusinessException("Respuesta vacía recibida desde la API de Gemini.");
            }

            log.debug("Respuesta cruda de Gemini: {}", body);

            return extractResultFromBody(body);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al llamar o procesar la respuesta de la API de Gemini: {}", e.getMessage(), e);
            throw new BusinessException("Error al interpretar tu mensaje financiero. Por favor intenta ser más descriptivo.");
        }
    }

    /**
     * Analiza la imagen de un ticket/recibo codificada en Base64 utilizando la API multimodal de Gemini.
     *
     * @param imageBytes Bytes de la imagen del ticket.
     * @param user       El usuario que realiza la petición para personalizar sus categorías y cuentas.
     * @return El resultado interpretado por la IA.
     */
    public AiTransactionResult parseImage(byte[] imageBytes, User user) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new BusinessException("La clave API de Gemini no está configurada. Por favor configúrala como 'gemini.api.key'.");
        }

        if (imageBytes == null || imageBytes.length == 0) {
            throw new BusinessException("Los bytes de la imagen están vacíos.");
        }

        // 1. Obtener categorías y cuentas del usuario
        List<Category> categories = categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail());
        List<Account> accounts = accountRepository.findByUserEmailOrderByNameAsc(user.getEmail());

        String categoriesStr = categories.stream()
                .map(Category::getName)
                .collect(Collectors.joining(", "));

        String accountsStr = accounts.stream()
                .map(Account::getName)
                .collect(Collectors.joining(", "));

        String firstAccount = accounts.isEmpty() ? "Principal" : accounts.get(0).getName();

        // 2. Construir el prompt multimodal con información de cuentas y categorías del usuario
        String visionPrompt = String.format(
                "Analiza esta imagen de un recibo o ticket de compra. Extrae el monto total, determina si es un 'ingreso' o un 'gasto' (usualmente será gasto), y sugiere una categoría. Devuelve ÚNICAMENTE un JSON con las claves: amount (número), type (string, 'INCOME' o 'EXPENSE'), categoryName (string) y accountName (string).\n\n" +
                "Reglas críticas:\n" +
                "1. Las categorías disponibles y permitidas del usuario son: [%s]. Si la imagen se asocia o coincide con alguna de ellas, usa EXACTAMENTE su nombre en la clave 'categoryName'. Si ninguna se asocia, sugiere una nueva categoría muy corta (máximo 1 o 2 palabras, ej: 'Supermercado', 'Gimnasio', 'Luz').\n" +
                "2. Las cuentas disponibles y permitidas del usuario son: [%s]. Si la imagen sugiere alguna cuenta (por ejemplo, si se menciona una tarjeta específica o banco en el ticket), usa EXACTAMENTE su nombre en la clave 'accountName'. Si no se menciona o no coincide con ninguna, usa como fallback: '%s'.\n" +
                "3. El tipo de transacción ('type') debe ser estrictamente 'INCOME' o 'EXPENSE'.\n" +
                "4. El monto ('amount') debe ser un número decimal. Si no se puede deducir el monto de ninguna manera, el valor debe ser nulo.\n\n" +
                "El JSON debe tener exactamente estas llaves:\n" +
                "{\n" +
                "  \"amount\": número,\n" +
                "  \"type\": \"INCOME\" o \"EXPENSE\",\n" +
                "  \"categoryName\": \"Nombre de la categoría\" (string),\n" +
                "  \"accountName\": \"Nombre de la cuenta\" (string)\n" +
                "}",
                categoriesStr, accountsStr, firstAccount
        );

        // 3. Convertir imagen a Base64
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // 4. Construir payload para Gemini API con soporte multimodal
        Map<String, Object> requestPayload = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", visionPrompt),
                                        Map.of("inlineData", Map.of(
                                                "mimeType", "image/jpeg",
                                                "data", base64Image
                                        ))
                                )
                        )
                ),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json"
                )
        );

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

        try {
            log.info("Enviando petición multimodal a Gemini API para procesar ticket...");
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            String body = response.getBody();

            if (body == null || body.trim().isEmpty()) {
                throw new BusinessException("Respuesta vacía recibida desde la API de Gemini.");
            }

            log.debug("Respuesta cruda de Gemini: {}", body);

            return extractResultFromBody(body);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al llamar o procesar la respuesta multimodal de la API de Gemini: {}", e.getMessage(), e);
            throw new BusinessException("Error al interpretar el ticket. Asegúrate de que la foto sea clara y nítida.");
        }
    }

    /**
     * Extrae el resultado de la transacción en formato DTO desde el cuerpo de respuesta de Gemini.
     */
    private AiTransactionResult extractResultFromBody(String body) throws Exception {
        Map<?, ?> rootMap = objectMapper.readValue(body, Map.class);
        List<?> candidates = (List<?>) rootMap.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new BusinessException("No se recibieron candidatos en la respuesta de Gemini.");
        }

        Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
        Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
        if (content == null) {
            throw new BusinessException("Contenido no disponible en el candidato de Gemini.");
        }

        List<?> parts = (List<?>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new BusinessException("Partes de respuesta no disponibles en la respuesta de Gemini.");
        }

        Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
        String jsonText = (String) firstPart.get("text");
        if (jsonText == null || jsonText.trim().isEmpty()) {
            throw new BusinessException("El texto del resultado de la IA está vacío.");
        }

        log.info("JSON extraído por la IA: {}", jsonText.trim());

        return objectMapper.readValue(jsonText, AiTransactionResult.class);
    }
}

