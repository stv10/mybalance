# Integración del Bot de Telegram con Reconocimiento Multimodal (Gemini Vision)

Este documento detalla la implementación realizada en el backend de **MyBalance** para dar soporte a la descarga e interpretación automática de tickets y recibos de compra en formato de imagen enviados al bot de Telegram.

## 1. Descripción de la Funcionalidad

El Bot de Telegram ahora no solo procesa comandos de texto para registrar transacciones, sino que también acepta **imágenes de tickets o recibos**.
Cuando un usuario envía una foto:
1. El bot descarga la foto con mayor resolución utilizando la API de Telegram.
2. Codifica los bytes de la imagen en formato Base64.
3. Envía una consulta multimodal a la API de **Gemini** (utilizando el modelo configurado, ej: `gemini-2.5-flash` o similar) adjuntando la imagen y un prompt específico con las categorías y cuentas del usuario.
4. Gemini analiza visualmente la imagen, extrae el monto, detecta si es un gasto o ingreso, y clasifica la transacción según las categorías reales del usuario.
5. El bot registra de forma automática la transacción en la base de datos y le responde de manera amigable al usuario con el resumen del registro.

---

## 2. Componentes Afectados y Nuevas Clases

### 1. `TelegramFileService` [NUEVO]
- **Ubicación**: `src/main/java/com/mybalance/infrastructure/bot/TelegramFileService.java`
- **Responsabilidad**:
  - Obtener la ruta del archivo (`filePath`) de la foto con mayor resolución a partir del `Update` recibido del bot a través de `telegramClient.execute(GetFile)`.
  - Realizar una petición GET utilizando `RestTemplate` a la URL de descarga de Telegram (`https://api.telegram.org/file/bot<token>/<filePath>`) para recuperar la imagen como un arreglo de bytes (`byte[]`).

### 2. `TransactionAiParserService` [MODIFICADO]
- **Ubicación**: `src/main/java/com/mybalance/infrastructure/bot/TransactionAiParserService.java`
- **Cambios**:
  - Se agregó el método `parseImage(byte[] imageBytes, User user)` para soportar el análisis de imágenes.
  - Codifica la imagen en `Base64` e incluye la estructura de partes `inlineData` junto con el prompt de texto multimodal en el payload JSON hacia la API de Gemini.
  - Se refactorizó la extracción y mapeo del resultado en el método privado `extractResultFromBody(String body)`.

### 3. `MyBalanceBot` [MODIFICADO]
- **Ubicación**: `src/main/java/com/mybalance/infrastructure/bot/MyBalanceBot.java`
- **Cambios**:
  - Se inyecta `TelegramFileService`.
  - Se implementó la lógica en `consume(Update update)` para capturar mensajes con imágenes a través de `update.getMessage().hasPhoto()`.
  - Si el usuario está correctamente vinculado, se procede a descargar e interpretar el ticket.

---

## 3. Pruebas Unitarias

Se agregaron pruebas unitarias exhaustivas utilizando **JUnit 5** y **Mockito** para asegurar la robustez de las nuevas integraciones y flujos alternativos (ej: llamadas fallidas de red, respuestas vacías, etc.).

- **`TelegramFileServiceTest.java`**:
  - Verifica la correcta selección del tamaño de foto más grande de la lista de `PhotoSize`.
  - Simula las llamadas a la API de Telegram (`telegramClient.execute`) y la petición HTTP GET del archivo.
  - Valida el control de excepciones ante datos incorrectos o nulos.

- **`TransactionAiParserServiceTest.java`**:
  - Valida la llamada multimodal enviada a la API de Gemini mediante mocks.
  - Asegura que el JSON devuelto por la IA sea correctamente mapeado al DTO `AiTransactionResult`.

---

## 4. Configuración y Variables de Entorno

No se agregaron nuevas variables obligatorias, pero el flujo multimodal depende de las siguientes variables ya existentes:
* `telegram.bot.token`: Token del bot de Telegram.
* `gemini.api.key`: Clave API de Gemini con permisos para realizar llamadas multimodales de generación de contenido.
* `gemini.api.model`: Nombre del modelo a utilizar (por defecto `gemini-2.5-flash`).
