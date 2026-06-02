package com.mybalance.category;

import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.category.dto.CategoryRequest;
import com.mybalance.category.dto.CategoryResponse;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories(String email) {
        return categoryRepository.findByUserEmailOrderByNameAsc(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        // Normalizar nombre para evitar duplicados insensibles al caso si es necesario (limpiando espacios)
        String nameNormalized = request.name().trim();

        if (categoryRepository.existsByUserEmailAndNameAndType(email, nameNormalized, request.type())) {
            throw new BusinessException("Ya existe una categoría con el nombre '" + nameNormalized + "' y tipo '" + request.type() + "'");
        }

        Category parent = null;
        if (request.parentCategoryId() != null) {
            parent = categoryRepository.findByIdAndUserEmail(request.parentCategoryId(), email)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.parentCategoryId().toString()));
            if (parent.getParent() != null && parent.getParent().getParent() != null) {
                throw new BusinessException("No se permite anidación de categorías de más de dos niveles.");
            }
            if (parent.getType() != request.type()) {
                throw new BusinessException("El tipo de la categoría hija debe coincidir con el de la categoría padre.");
            }
        }

        Category category = Category.builder()
                .user(user)
                .name(nameNormalized)
                .type(request.type())
                .parent(parent)
                .isUserCreated(true)
                .build();

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    @Transactional
    public void deleteCategory(UUID id, String email) {
        Category category = categoryRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id.toString()));

        if (!category.isUserCreated()) {
            throw new BusinessException("No se pueden eliminar las categorías base del sistema.");
        }

        try {
            categoryRepository.delete(category);
            // Ejecutar flush para forzar que los constraints se validen dentro de la transacción actual
            categoryRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException("No se puede eliminar la categoría porque tiene transacciones u otros registros asociados.");
        }
    }

    public CategoryResponse mapToResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getType(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getParent() != null ? category.getParent().getName() : null,
                category.isUserCreated(),
                category.getCreatedAt()
        );
    }
}
