package com.mybalance.infrastructure.bot;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;
import org.telegram.telegrambots.meta.api.methods.GetFile;
import org.telegram.telegrambots.meta.api.objects.File;
import org.telegram.telegrambots.meta.api.objects.PhotoSize;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TelegramFileServiceTest {

    @Mock
    private TelegramClient telegramClient;

    @Mock
    private RestTemplate restTemplate;

    private TelegramFileService telegramFileService;
    private final String botToken = "dummy_token";

    @BeforeEach
    void setUp() {
        telegramFileService = new TelegramFileService(botToken, telegramClient, restTemplate);
    }

    @Test
    @DisplayName("Debería descargar la foto con mayor resolución correctamente")
    void testDownloadPhotoSuccess() throws Exception {
        // Arrange
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        PhotoSize smallPhoto = mock(PhotoSize.class);
        PhotoSize largePhoto = mock(PhotoSize.class);
        File fileMetadata = mock(File.class);

        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasPhoto()).thenReturn(true);

        List<PhotoSize> photoList = List.of(smallPhoto, largePhoto);
        when(message.getPhoto()).thenReturn(photoList);

        when(largePhoto.getFileId()).thenReturn("large_file_id");
        when(fileMetadata.getFilePath()).thenReturn("photos/large_photo.jpg");

        // Simular ejecución del método GetFile de Telegram API
        when(telegramClient.execute(any(GetFile.class))).thenReturn(fileMetadata);

        byte[] expectedBytes = new byte[]{1, 2, 3, 4};
        String expectedUrl = "https://api.telegram.org/file/bot" + botToken + "/photos/large_photo.jpg";
        when(restTemplate.getForObject(eq(expectedUrl), eq(byte[].class))).thenReturn(expectedBytes);

        // Act
        byte[] result = telegramFileService.downloadPhoto(update);

        // Assert
        assertNotNull(result);
        assertArrayEquals(expectedBytes, result);
        verify(telegramClient, times(1)).execute(any(GetFile.class));
        verify(restTemplate, times(1)).getForObject(eq(expectedUrl), eq(byte[].class));
    }

    @Test
    @DisplayName("Debería lanzar IllegalArgumentException cuando el update es null")
    void testDownloadPhotoUpdateNull() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            telegramFileService.downloadPhoto(null);
        });
        assertEquals("El update no contiene un mensaje con foto", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar IllegalArgumentException cuando el update no tiene mensaje")
    void testDownloadPhotoNoMessage() {
        Update update = mock(Update.class);
        when(update.hasMessage()).thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            telegramFileService.downloadPhoto(update);
        });
        assertEquals("El update no contiene un mensaje con foto", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar IllegalArgumentException cuando el mensaje no tiene fotos")
    void testDownloadPhotoMessageNoPhoto() {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasPhoto()).thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            telegramFileService.downloadPhoto(update);
        });
        assertEquals("El update no contiene un mensaje con foto", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar IllegalArgumentException cuando la lista de fotos es null")
    void testDownloadPhotoListNull() {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasPhoto()).thenReturn(true);
        when(message.getPhoto()).thenReturn(null);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            telegramFileService.downloadPhoto(update);
        });
        assertEquals("La lista de fotos está vacía", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar IllegalArgumentException cuando la lista de fotos está vacía")
    void testDownloadPhotoListEmpty() {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasPhoto()).thenReturn(true);
        when(message.getPhoto()).thenReturn(Collections.emptyList());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            telegramFileService.downloadPhoto(update);
        });
        assertEquals("La lista de fotos está vacía", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar RuntimeException cuando la API de Telegram devuelve un archivo o path nulo")
    void testDownloadPhotoFileMetadataNull() throws Exception {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        PhotoSize photo = mock(PhotoSize.class);

        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasPhoto()).thenReturn(true);
        when(message.getPhoto()).thenReturn(List.of(photo));
        when(photo.getFileId()).thenReturn("some_file_id");

        when(telegramClient.execute(any(GetFile.class))).thenReturn(null);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            telegramFileService.downloadPhoto(update);
        });
        assertEquals("No se pudo obtener el filePath desde la API de Telegram", exception.getMessage());
    }

    @Test
    @DisplayName("Debería lanzar RuntimeException cuando la descarga de HTTP falla (retorna nulo)")
    void testDownloadPhotoDownloadFails() throws Exception {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        PhotoSize photo = mock(PhotoSize.class);
        File fileMetadata = mock(File.class);

        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasPhoto()).thenReturn(true);
        when(message.getPhoto()).thenReturn(List.of(photo));
        when(photo.getFileId()).thenReturn("some_file_id");
        when(fileMetadata.getFilePath()).thenReturn("photos/photo.jpg");

        when(telegramClient.execute(any(GetFile.class))).thenReturn(fileMetadata);

        String expectedUrl = "https://api.telegram.org/file/bot" + botToken + "/photos/photo.jpg";
        when(restTemplate.getForObject(eq(expectedUrl), eq(byte[].class))).thenReturn(null);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            telegramFileService.downloadPhoto(update);
        });
        assertEquals("No se pudieron descargar los bytes de la foto", exception.getMessage());
    }
}
