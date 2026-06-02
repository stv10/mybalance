package com.mybalance.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BotAuthService {

    private final UserRepository userRepository;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$"
    );

    @Transactional
    public String processLinkRequest(Long chatId, String text) {
        String cleanText = text.trim();
        
        if (!EMAIL_PATTERN.matcher(cleanText).matches()) {
            return "❌ El texto enviado no tiene un formato de correo electrónico válido. Por favor, introduce el email con el que te registraste.";
        }

        Optional<User> userOpt = userRepository.findByEmail(cleanText);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setTelegramChatId(chatId);
            userRepository.save(user);
            log.info("Cuenta de Telegram vinculada con éxito. Usuario: {}, ChatId: {}", user.getEmail(), chatId);
            return "✅ Cuenta vinculada exitosamente. Ya puedes enviarme tus gastos.";
        } else {
            return "❌ No encontré ningún usuario con ese email. Intenta de nuevo.";
        }
    }
}
