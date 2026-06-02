package com.mybalance.auth;

import com.mybalance.auth.dto.AuthResponse;
import com.mybalance.auth.dto.LoginRequest;
import com.mybalance.auth.dto.RegisterRequest;
import com.mybalance.category.Category;
import com.mybalance.category.CategoryRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.shared.exception.BusinessException;
import com.mybalance.account.Account;
import com.mybalance.account.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email already in use: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        userRepository.save(user);

        // Sembrar cuenta por defecto para el nuevo usuario
        Account defaultAccount = Account.builder()
                .user(user)
                .name("Principal")
                .balance(BigDecimal.ZERO)
                .build();
        accountRepository.save(defaultAccount);

        // Sembrar categorías por defecto para el nuevo usuario
        Category vida = Category.builder().user(user).name("Vida").type(CategoryType.EXPENSE).isUserCreated(false).build();
        Category ocio = Category.builder().user(user).name("Ocio").type(CategoryType.EXPENSE).isUserCreated(false).build();
        Category inversionDeuda = Category.builder().user(user).name("Inversion-Deuda").type(CategoryType.EXPENSE).isUserCreated(false).build();
        Category sueldo = Category.builder().user(user).name("Sueldo").type(CategoryType.INCOME).isUserCreated(false).build();

        categoryRepository.saveAll(List.of(vida, ocio, inversionDeuda, sueldo));

        List<Category> defaultCategories = List.of(
                Category.builder().user(user).name("Comida").type(CategoryType.EXPENSE).parent(vida).isUserCreated(false).build()
        );
        categoryRepository.saveAll(defaultCategories);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getName());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getName());
    }
}
