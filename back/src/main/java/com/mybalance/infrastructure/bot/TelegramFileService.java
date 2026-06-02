package com.mybalance.infrastructure.bot;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.meta.api.methods.GetFile;
import org.telegram.telegrambots.meta.api.objects.File;
import org.telegram.telegrambots.meta.api.objects.PhotoSize;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;

@Service
public class TelegramFileService {

    private static final Logger log = LoggerFactory.getLogger(TelegramFileService.class);

    private final String botToken;
    private final TelegramClient telegramClient;
    private final RestTemplate restTemplate;

    // Constructor para inyección de Spring (producción)
    @Autowired
    public TelegramFileService(@Value("${telegram.bot.token}") String botToken) {
        this.botToken = botToken;
        this.telegramClient = new OkHttpTelegramClient(botToken);
        this.restTemplate = new RestTemplate();
        log.info("TelegramFileService inicializado con éxito.");
    }

    // Constructor package-private para pruebas unitarias (Mockito)
    TelegramFileService(String botToken, TelegramClient telegramClient, RestTemplate restTemplate) {
        this.botToken = botToken;
        this.telegramClient = telegramClient;
        this.restTemplate = restTemplate;
    }

    /**
     * Descarga la foto enviada en el Update de Telegram (tomando la de mayor resolución).
     *
     * @param update El Update de Telegram recibido.
     * @return El arreglo de bytes de la imagen descargada.
     * @throws Exception Si ocurre algún error en la validación, llamada a la API o descarga.
     */
    public byte[] downloadPhoto(Update update) throws Exception {
        if (update == null || !update.hasMessage() || !update.getMessage().hasPhoto()) {
            throw new IllegalArgumentException("El update no contiene un mensaje con foto");
        }

        List<PhotoSize> photos = update.getMessage().getPhoto();
        if (photos == null || photos.isEmpty()) {
            throw new IllegalArgumentException("La lista de fotos está vacía");
        }

        // Obtener el último elemento de la lista (que representa la foto con mayor resolución)
        PhotoSize largestPhoto = photos.get(photos.size() - 1);
        String fileId = largestPhoto.getFileId();
        log.info("Obteniendo filePath para fileId: {}", fileId);

        // Obtener metadatos del archivo de la API de Telegram
        GetFile getFile = GetFile.builder().fileId(fileId).build();
        File file = telegramClient.execute(getFile);
        if (file == null || file.getFilePath() == null) {
            throw new RuntimeException("No se pudo obtener el filePath desde la API de Telegram");
        }

        String filePath = file.getFilePath();
        log.info("FilePath obtenido: {}", filePath);

        // Hacer la petición HTTP GET para obtener los bytes del archivo
        String downloadUrl = String.format("https://api.telegram.org/file/bot%s/%s", botToken, filePath);
        log.info("Descargando archivo desde la URL de Telegram...");

        byte[] fileBytes = restTemplate.getForObject(downloadUrl, byte[].class);
        if (fileBytes == null) {
            throw new RuntimeException("No se pudieron descargar los bytes de la foto");
        }

        log.info("Foto descargada exitosamente. Tamaño: {} bytes", fileBytes.length);
        return fileBytes;
    }
}
