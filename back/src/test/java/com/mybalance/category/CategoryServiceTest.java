package com.mybalance.category;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.category.dto.CategoryRequest;
import com.mybalance.category.dto.CategoryResponse;
import com.mybalance.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    private CategoryService categoryService;
    private String userEmail;
    private User user;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository, userRepository);
        userEmail = "user@test.com";
        user = User.builder()
                .id(UUID.randomUUID())
                .name("Test User")
                .email(userEmail)
                .build();
    }

    @Test
    @DisplayName("Debería crear una categoría raíz (Nivel 0) sin problemas")
    void testCreateRootCategory() {
        CategoryRequest request = new CategoryRequest("Vida", CategoryType.EXPENSE, null);
        
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(categoryRepository.existsByUserEmailAndNameAndType(userEmail, "Vida", CategoryType.EXPENSE)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CategoryResponse response = categoryService.createCategory(request, userEmail);

        assertNotNull(response);
        assertEquals("Vida", response.name());
        assertNull(response.parentCategoryId());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    @DisplayName("Debería crear una categoría de Nivel 1 vinculada a una categoría raíz")
    void testCreateLevel1Category() {
        UUID parentId = UUID.randomUUID();
        Category rootParent = Category.builder()
                .id(parentId)
                .name("Vida")
                .type(CategoryType.EXPENSE)
                .parent(null) // Es raíz (Nivel 0)
                .build();

        CategoryRequest request = new CategoryRequest("Comida", CategoryType.EXPENSE, parentId);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(categoryRepository.existsByUserEmailAndNameAndType(userEmail, "Comida", CategoryType.EXPENSE)).thenReturn(false);
        when(categoryRepository.findByIdAndUserEmail(parentId, userEmail)).thenReturn(Optional.of(rootParent));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CategoryResponse response = categoryService.createCategory(request, userEmail);

        assertNotNull(response);
        assertEquals("Comida", response.name());
        assertEquals(parentId, response.parentCategoryId());
    }

    @Test
    @DisplayName("Debería crear una categoría de Nivel 2 vinculada a una categoría de Nivel 1")
    void testCreateLevel2Category() {
        UUID grandparentId = UUID.randomUUID();
        Category rootGrandparent = Category.builder()
                .id(grandparentId)
                .name("Vida")
                .type(CategoryType.EXPENSE)
                .parent(null)
                .build();

        UUID parentId = UUID.randomUUID();
        Category level1Parent = Category.builder()
                .id(parentId)
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .parent(rootGrandparent) // Nivel 1
                .build();

        CategoryRequest request = new CategoryRequest("Pedidos", CategoryType.EXPENSE, parentId);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(categoryRepository.existsByUserEmailAndNameAndType(userEmail, "Pedidos", CategoryType.EXPENSE)).thenReturn(false);
        when(categoryRepository.findByIdAndUserEmail(parentId, userEmail)).thenReturn(Optional.of(level1Parent));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CategoryResponse response = categoryService.createCategory(request, userEmail);

        assertNotNull(response);
        assertEquals("Pedidos", response.name());
        assertEquals(parentId, response.parentCategoryId());
    }

    @Test
    @DisplayName("Debería lanzar excepción si se intenta crear una categoría de Nivel 3 (más de 2 niveles)")
    void testCreateLevel3CategoryThrowsException() {
        UUID greatGrandparentId = UUID.randomUUID();
        Category rootGreatGrandparent = Category.builder()
                .id(greatGrandparentId)
                .name("Vida")
                .type(CategoryType.EXPENSE)
                .parent(null)
                .build();

        UUID grandparentId = UUID.randomUUID();
        Category level1Grandparent = Category.builder()
                .id(grandparentId)
                .name("Comida")
                .type(CategoryType.EXPENSE)
                .parent(rootGreatGrandparent) // Nivel 1
                .build();

        UUID parentId = UUID.randomUUID();
        Category level2Parent = Category.builder()
                .id(parentId)
                .name("Pedidos")
                .type(CategoryType.EXPENSE)
                .parent(level1Grandparent) // Nivel 2
                .build();

        CategoryRequest request = new CategoryRequest("Burgers", CategoryType.EXPENSE, parentId);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(categoryRepository.existsByUserEmailAndNameAndType(userEmail, "Burgers", CategoryType.EXPENSE)).thenReturn(false);
        when(categoryRepository.findByIdAndUserEmail(parentId, userEmail)).thenReturn(Optional.of(level2Parent));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            categoryService.createCategory(request, userEmail);
        });

        assertTrue(exception.getMessage().contains("No se permite anidación de categorías de más de dos niveles"));
        verify(categoryRepository, never()).save(any(Category.class));
    }
}
