package com.mybalance.auth;

import com.mybalance.auth.dto.AuthResponse;
import com.mybalance.auth.dto.RegisterRequest;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private AccountRepository accountRepository;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, categoryRepository, accountRepository);
    }

    @Test
    @DisplayName("Debería registrar un nuevo usuario y sembrar SOLAMENTE Comida como subcategoría por defecto")
    void testRegisterSeedsOnlyComidaCategory() {
        RegisterRequest request = new RegisterRequest("Carlos", "carlos@test.com", "password123");

        when(userRepository.existsByEmail("carlos@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        when(jwtService.generateToken(any(), eq("carlos@test.com"))).thenReturn("testJwtToken");

        // Ejecutar
        AuthResponse response = authService.register(request);

        // Verificar respuesta
        assertNotNull(response);
        assertEquals("testJwtToken", response.token());
        assertEquals("carlos@test.com", response.email());
        assertEquals("Carlos", response.name());

        // Capturar las categorías raíz guardadas en la primera llamada saveAll
        ArgumentCaptor<List<Category>> rootCategoriesCaptor = ArgumentCaptor.forClass(List.class);
        verify(categoryRepository, times(2)).saveAll(rootCategoriesCaptor.capture());

        List<List<Category>> capturedCalls = rootCategoriesCaptor.getAllValues();
        
        // Primera llamada: Vida, Ocio, Inversion-Deuda, Sueldo
        List<Category> rootCats = capturedCalls.get(0);
        assertEquals(4, rootCats.size());
        assertTrue(rootCats.stream().anyMatch(c -> c.getName().equals("Vida")));
        assertTrue(rootCats.stream().anyMatch(c -> c.getName().equals("Ocio")));
        assertTrue(rootCats.stream().anyMatch(c -> c.getName().equals("Inversion-Deuda")));
        assertTrue(rootCats.stream().anyMatch(c -> c.getName().equals("Sueldo")));

        // Segunda llamada: Subcategorías por defecto. Debería contener SOLAMENTE Comida (Fijos y Gustos eliminados)
        List<Category> subCats = capturedCalls.get(1);
        assertEquals(1, subCats.size(), "Debería sembrarse únicamente la categoría Comida");
        Category comidaCat = subCats.get(0);
        assertEquals("Comida", comidaCat.getName());
        assertEquals(CategoryType.EXPENSE, comidaCat.getType());
        assertFalse(comidaCat.isUserCreated(), "La categoría Comida sembrada por el sistema debe ser base (isUserCreated = false)");
        
        // Verificar que hereda de la categoría Vida
        assertNotNull(comidaCat.getParent());
        assertEquals("Vida", comidaCat.getParent().getName());
    }
}
