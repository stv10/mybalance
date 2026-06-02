package com.mybalance.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BotAuthService botAuthService;

    @Test
    void whenEmailFormatIsInvalid_shouldReturnFormatError() {
        // Arrange
        Long chatId = 123456L;
        String invalidEmail = "esto-no-es-un-correo";

        // Act
        String result = botAuthService.processLinkRequest(chatId, invalidEmail);

        // Assert
        assertTrue(result.contains("❌ El texto enviado no tiene un formato de correo electrónico válido."));
        verifyNoInteractions(userRepository);
    }

    @Test
    void whenEmailDoesNotExist_shouldReturnNotFoundError() {
        // Arrange
        Long chatId = 123456L;
        String nonExistentEmail = "inexistente@correo.com";
        when(userRepository.findByEmail(nonExistentEmail)).thenReturn(Optional.empty());

        // Act
        String result = botAuthService.processLinkRequest(chatId, nonExistentEmail);

        // Assert
        assertTrue(result.contains("❌ No encontré ningún usuario con ese email."));
        verify(userRepository, times(1)).findByEmail(nonExistentEmail);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void whenEmailExists_shouldLinkChatIdAndReturnSuccess() {
        // Arrange
        Long chatId = 123456L;
        String existingEmail = "usuario@correo.com";
        User user = User.builder()
                .email(existingEmail)
                .name("Juan Perez")
                .build();
        
        when(userRepository.findByEmail(existingEmail)).thenReturn(Optional.of(user));

        // Act
        String result = botAuthService.processLinkRequest(chatId, existingEmail);

        // Assert
        assertTrue(result.contains("✅ Cuenta vinculada exitosamente."));
        assertEquals(chatId, user.getTelegramChatId());
        verify(userRepository, times(1)).findByEmail(existingEmail);
        verify(userRepository, times(1)).save(user);
    }
}
