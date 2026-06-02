package com.mybalance.infrastructure.bot;

import com.mybalance.auth.BotAuthService;
import com.mybalance.auth.User;
import com.mybalance.auth.UserRepository;
import com.mybalance.category.CategoryType;
import com.mybalance.infrastructure.bot.dto.AiTransactionResult;
import com.mybalance.transaction.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.longpolling.interfaces.LongPollingUpdateConsumer;
import org.telegram.telegrambots.longpolling.starter.SpringLongPollingBot;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.Optional;

@Component
@ConditionalOnExpression("'${telegram.bot.token:}'.trim().length() > 0")
public class MyBalanceBot implements SpringLongPollingBot, LongPollingSingleThreadUpdateConsumer {

    private static final Logger log = LoggerFactory.getLogger(MyBalanceBot.class);

    private final String botToken;
    private final String botUsername;
    private final TelegramClient telegramClient;
    private final UserRepository userRepository;
    private final BotAuthService botAuthService;
    private final TransactionAiParserService transactionAiParserService;
    private final BotTransactionHandler botTransactionHandler;
    private final TelegramFileService telegramFileService;

    public MyBalanceBot(
            @Value("${telegram.bot.token}") String botToken,
            @Value("${telegram.bot.username}") String botUsername,
            UserRepository userRepository,
            BotAuthService botAuthService,
            TransactionAiParserService transactionAiParserService,
            BotTransactionHandler botTransactionHandler,
            TelegramFileService telegramFileService) {
        this.botToken = botToken;
        this.botUsername = botUsername;
        this.telegramClient = new OkHttpTelegramClient(botToken);
        this.userRepository = userRepository;
        this.botAuthService = botAuthService;
        this.transactionAiParserService = transactionAiParserService;
        this.botTransactionHandler = botTransactionHandler;
        this.telegramFileService = telegramFileService;
        log.info("Telegram Bot inicializado con el usuario: {}", botUsername);
    }

    @Override
    public String getBotToken() {
        return botToken;
    }

    @Override
    public LongPollingUpdateConsumer getUpdatesConsumer() {
        return this;
    }

    @Override
    public void consume(Update update) {
        if (update == null || !update.hasMessage()) {
            return;
        }

        if (update.getMessage().hasText()) {
            String text = update.getMessage().getText().trim();
            Long chatId = update.getMessage().getChatId();
            log.info("Telegram Bot - Mensaje recibido: '{}' de ChatId: {}", text, chatId);

            Optional<User> linkedUser = userRepository.findByTelegramChatId(chatId);

            if (linkedUser.isEmpty()) {
                if (text.equalsIgnoreCase("/start")) {
                    sendTextMessage(chatId, "¡Hola! Para empezar, por favor envíame el email con el que te registraste en MyBalance.");
                } else {
                    String response = botAuthService.processLinkRequest(chatId, text);
                    sendTextMessage(chatId, response);
                }
            } else {
                if (text.equalsIgnoreCase("/start")) {
                    sendTextMessage(chatId, "✅ Tu cuenta ya está vinculada con MyBalance.");
                } else {
                    try {
                        User user = linkedUser.get();
                        
                        // 1. Interpretar mensaje con IA
                        AiTransactionResult aiResult = transactionAiParserService.parseTransaction(text, user);
                        
                        // 2. Procesar y persistir la transacción
                        Transaction transaction = botTransactionHandler.handleTransaction(aiResult, user, text);
                        
                        // 3. Formatear tipo de transacción de forma legible para el usuario
                        String readableType = transaction.getType() == CategoryType.INCOME ? "ingreso" : "gasto";
                        
                        // 4. Responder con éxito
                        String successMessage = String.format(
                                "✅ ¡Listo! Registré un %s de $%s en la categoría %s usando la cuenta %s.",
                                readableType,
                                transaction.getAmount().toString(),
                                transaction.getCategory().getName(),
                                transaction.getAccount().getName()
                        );
                        sendTextMessage(chatId, successMessage);
                        
                    } catch (Exception e) {
                        log.error("Error al procesar mensaje financiero del usuario vinculado: {}", e.getMessage(), e);
                        sendTextMessage(chatId, "❌ No pude procesar tu mensaje. Asegúrate de incluir el monto y el concepto. Ejemplo: 'Gaste 500 en comida' o 'Cobré sueldo de 15000'.");
                    }
                }
            }
        } else if (update.getMessage().hasPhoto()) {
            Long chatId = update.getMessage().getChatId();
            log.info("Telegram Bot - Foto recibida de ChatId: {}", chatId);

            Optional<User> linkedUser = userRepository.findByTelegramChatId(chatId);

            if (linkedUser.isEmpty()) {
                sendTextMessage(chatId, "❌ Tu cuenta de Telegram no está vinculada. Por favor envíame primero el email con el que te registraste en MyBalance para vincularla.");
            } else {
                try {
                    User user = linkedUser.get();
                    log.info("Descargando imagen del ticket enviado por ChatId: {}", chatId);
                    
                    // 1. Descargar los bytes de la imagen
                    byte[] imageBytes = telegramFileService.downloadPhoto(update);
                    
                    // 2. Pasar los bytes y el usuario a la IA multimodal
                    AiTransactionResult aiResult = transactionAiParserService.parseImage(imageBytes, user);
                    
                    // 3. Procesar y guardar la transacción
                    Transaction transaction = botTransactionHandler.handleTransaction(aiResult, user, "📸 Recibo procesado");
                    
                    // 4. Formatear tipo de transacción legible para el usuario
                    String readableType = transaction.getType() == CategoryType.INCOME ? "ingreso" : "gasto";
                    
                    // 5. Responder al usuario en Telegram
                    String successMessage = String.format(
                            "📸 ¡Ticket procesado! Registré un %s de $%s en la categoría %s.",
                            readableType,
                            transaction.getAmount().toString(),
                            transaction.getCategory().getName()
                    );
                    sendTextMessage(chatId, successMessage);
                    
                } catch (Exception e) {
                    log.error("Error al procesar la imagen de ticket del usuario vinculado: {}", e.getMessage(), e);
                    sendTextMessage(chatId, "❌ No pude procesar la imagen del ticket. Asegúrate de que la foto sea clara y nítida.");
                }
            }
        }
    }

    private void sendTextMessage(Long chatId, String text) {
        SendMessage message = SendMessage.builder()
                .chatId(chatId.toString())
                .text(text)
                .build();
        try {
            telegramClient.execute(message);
        } catch (TelegramApiException e) {
            log.error("Error al enviar mensaje a ChatId {}: {}", chatId, e.getMessage(), e);
        }
    }
}

