package com.mybalance.infrastructure.bot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import com.mybalance.auth.User;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.infrastructure.bot.dto.AiTransactionResult;
import com.mybalance.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionAiParserServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private TransactionAiParserService parserService;

    private final String apiKey = "dummy_key";
    private final String model = "gemini-2.5-flash";

    private User user;
    private Category category;
    private Account account;

    @BeforeEach
    void setUp() {
        parserService = new TransactionAiParserService(
                apiKey, model, categoryRepository, accountRepository, restTemplate, objectMapper
        );

        user = User.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .email("carlos@test.com")
                .build();

        category = Category.builder()
                .id(UUID.randomUUID())
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .user(user)
                .build();

        account = Account.builder()
                .id(UUID.randomUUID())
                .name("Principal")
                .balance(new BigDecimal("500.00"))
                .user(user)
                .build();
    }

    @Test
    @DisplayName("Debería analizar texto correctamente y retornar AiTransactionResult")
    void testParseTransactionSuccess() {
        // Arrange
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(List.of(category));
        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(List.of(account));

        String geminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\\"amount\\\": 150.50, \\\"type\\\": \\\"EXPENSE\\\", \\\"categoryName\\\": \\\"Comida\\\", \\\"accountName\\\": \\\"Principal\\\"}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        ResponseEntity<String> responseEntity = ResponseEntity.ok(geminiResponse);
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // Act
        AiTransactionResult result = parserService.parseTransaction("Gaste 150.50 en comida", user);

        // Assert
        assertNotNull(result);
        assertEquals(new BigDecimal("150.50"), result.amount());
        assertEquals("EXPENSE", result.type());
        assertEquals("Comida", result.categoryName());
        assertEquals("Principal", result.accountName());

        verify(categoryRepository, times(1)).findByUserEmailOrderByNameAsc(user.getEmail());
        verify(accountRepository, times(1)).findByUserEmailOrderByNameAsc(user.getEmail());
        verify(restTemplate, times(1)).postForEntity(any(String.class), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("Debería analizar una imagen (multimodal) correctamente y retornar AiTransactionResult")
    void testParseImageSuccess() {
        // Arrange
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(List.of(category));
        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(List.of(account));

        String geminiResponse = "{\n" +
                "  \"candidates\": [{\n" +
                "    \"content\": {\n" +
                "      \"parts\": [{\n" +
                "        \"text\": \"{\\\"amount\\\": 450.00, \\\"type\\\": \\\"EXPENSE\\\", \\\"categoryName\\\": \\\"Comida\\\", \\\"accountName\\\": \\\"Principal\\\"}\"\n" +
                "      }]\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        ResponseEntity<String> responseEntity = ResponseEntity.ok(geminiResponse);
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        byte[] dummyImage = new byte[]{1, 2, 3, 4};

        // Act
        AiTransactionResult result = parserService.parseImage(dummyImage, user);

        // Assert
        assertNotNull(result);
        assertEquals(new BigDecimal("450.00"), result.amount());
        assertEquals("EXPENSE", result.type());
        assertEquals("Comida", result.categoryName());
        assertEquals("Principal", result.accountName());

        verify(categoryRepository, times(1)).findByUserEmailOrderByNameAsc(user.getEmail());
        verify(accountRepository, times(1)).findByUserEmailOrderByNameAsc(user.getEmail());
        verify(restTemplate, times(1)).postForEntity(any(String.class), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("Debería lanzar BusinessException si la respuesta de Gemini tiene cuerpo vacío")
    void testParseImageEmptyBody() {
        when(categoryRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(List.of(category));
        when(accountRepository.findByUserEmailOrderByNameAsc(user.getEmail())).thenReturn(List.of(account));

        ResponseEntity<String> responseEntity = ResponseEntity.ok("");
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        byte[] dummyImage = new byte[]{1, 2, 3, 4};

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            parserService.parseImage(dummyImage, user);
        });

        assertEquals("Respuesta vacía recibida desde la API de Gemini.", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar BusinessException si los bytes de la imagen están vacíos")
    void testParseImageEmptyBytes() {
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            parserService.parseImage(new byte[0], user);
        });
        assertEquals("Los bytes de la imagen están vacíos.", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar BusinessException si la API Key está vacía")
    void testParseTransactionEmptyApiKey() {
        TransactionAiParserService serviceNoKey = new TransactionAiParserService(
                "", model, categoryRepository, accountRepository, restTemplate, objectMapper
        );

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            serviceNoKey.parseTransaction("Gaste 10", user);
        });
        assertEquals("La clave API de Gemini no está configurada. Por favor configúrala como 'gemini.api.key'.", exception.getMessage());
    }
}
