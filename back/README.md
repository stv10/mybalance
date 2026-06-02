# MyBalance Backend API — Guía de Desarrollo

Este es el módulo backend de **MyBalance**, un rastreador de presupuestos personales. Está construido utilizando **Java 25**, **Spring Boot 3.5.3**, y **PostgreSQL**.

---

## Requisitos Previos

* **Java**: JDK 25.
* **Database**: PostgreSQL (corriendo localmente o en un contenedor Docker en el puerto 5432).
* **Maven**: Incluido mediante el wrapper `./mvnw`.

---

## Configuración Local y Manejo de Secretos

Para garantizar que ningún secreto (tokens, firmas, contraseñas) sea subido por error al repositorio de Git, este proyecto implementa una **estrategia de configuración local opcional** mediante perfiles y archivos excluidos.

### El archivo `application-local.yml`

El archivo `application-local.yml` está registrado en el `.gitignore` del proyecto y **nunca será subido a Git**. Se utiliza para definir o sobrescribir secretos y propiedades locales de tu propia máquina.

#### Creación del archivo local
Si deseas usar credenciales locales, simplemente crea el archivo en la siguiente ruta:
`back/src/main/resources/application-local.yml`

#### Plantilla del archivo
```yaml
# Configuración local de secretos (excluido de Git)
telegram:
  bot:
    token: "TU_TOKEN_DE_TELEGRAM_AQUI"
    username: "TU_USERNAME_DE_BOT_AQUI"

app:
  jwt:
    secret: "tu-firma-privada-jwt-personal-muy-larga-y-compleja"
```

Spring Boot detectará e importará este archivo automáticamente durante el arranque en el perfil de desarrollo (`dev`), sobrescribiendo cualquier propiedad del archivo `application-dev.yml` público.

---

## Bot de Telegram (Modo Long Polling)

El proyecto incluye la base para el soporte de un bot de Telegram con Long Polling. 

### Arranque Condicional Inteligente
El bot está protegido mediante una condición dinámica en la clase `MyBalanceBot`:
```java
@ConditionalOnExpression("'${telegram.bot.token:}'.trim().length() > 0")
```
* **Si el token está vacío**: El bot **no será inicializado** y la aplicación arrancará y operará normalmente (API REST, base de datos) sin requerir credenciales del bot.
* **Si el token está configurado** (en tu `application-local.yml` o vía variables de entorno): El bot se inicializará automáticamente y se conectará en segundo plano por Long Polling.

---

## Comandos Útiles

### Compilar el proyecto
```bash
./mvnw clean compile
```

### Ejecutar Tests
```bash
./mvnw test
```

### Arrancar la aplicación localmente
```bash
./mvnw spring-boot:run
```
