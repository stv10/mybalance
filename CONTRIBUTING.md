# Guía de Contribución a MyBalance 🚀

¡Gracias por tu interés en contribuir a **MyBalance**! Tu ayuda hace que esta herramienta sea mejor para toda la comunidad de finanzas personales.

Esta guía te ayudará a empezar a contribuir de manera efectiva y ordenada.

---

## 🛠️ Requisitos Previos

Para desarrollar localmente en este monorepo, te recomendamos contar con:
*   [Docker](https://www.docker.com/) y **Docker Compose**.
*   [Node.js](https://nodejs.org/) (v20 o superior) si quieres correr el frontend fuera de Docker.
*   [Java JDK 25](https://adoptium.net/) y **Maven** si deseas depurar o desarrollar el backend localmente de forma nativa.

---

## 💻 Desarrollo Local Rápido

La forma más sencilla de comenzar es levantando todo el stack con Docker Compose:

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/mybalance.git
    cd mybalance
    ```

2.  **Levanta la aplicación:**
    ```bash
    docker compose up --build
    ```
    Esto levantará:
    *   Base de datos PostgreSQL en el puerto `5432`
    *   Backend API en `http://localhost:8080` (con Swagger disponible en `http://localhost:8080/swagger-ui.html`)
    *   Frontend Client en `http://localhost`

---

## 🌿 Flujo de Trabajo con Ramas

Para mantener un historial limpio y estructurado, seguimos el flujo estándar de Git:

1.  **Forkea** el repositorio original a tu propia cuenta de GitHub.
2.  Crea una rama descriptiva para tus cambios:
    *   Para nuevas características: `feature/mi-nueva-caracteristica`
    *   Para corregir errores: `bugfix/corregir-nombre-error`
    *   Para documentación: `docs/mejorar-detalles`
3.  Realiza tus commits siguiendo la convención de **Conventional Commits** (ver sección abajo).
4.  Asegúrate de que tus tests pasen localmente (`mvn test` en `/back` y `npm run lint` en `/front`).
5.  Abre un **Pull Request (PR)** hacia la rama `main` del repositorio original.

---

## 📝 Convención de Commits

Utilizamos **Conventional Commits** para generar historiales claros y automatizar releases. Tus commits deben seguir el formato:

`<tipo>(<ámbito opcional>): <descripción corta en minúsculas>`

### Tipos comunes:
*   `feat`: Una nueva característica (ej: `feat(budget): add rollover budget option`).
*   `fix`: Solución de un error (ej: `fix(auth): resolve jwt token expiration check`).
*   `docs`: Cambios únicamente en la documentación (ej: `docs: update setup instructions in readme`).
*   `style`: Cambios estéticos, formateo o faltas de ortografía que no afectan el comportamiento del código.
*   `refactor`: Modificación de código que no arregla un bug ni añade una característica.
*   `test`: Añadir o corregir pruebas unitarias o de integración.
*   `chore`: Actualizaciones de dependencias, scripts de build, etc.

---

## 🎨 Estándares de Diseño y Código

### Backend (Java 25 & Spring Boot)
*   Mantén las clases controladoras limpias; la lógica de negocio pertenece a los servicios.
*   Asegúrate de que las consultas pesadas estén optimizadas mediante indexación o JPA estructurado.
*   Preserva la estructura de paquetes y nomenclatura existente (`com.mybalance.*`).

### Frontend (React & Vite)
*   **Vanilla CSS:** No utilices utilidades externas o librerías de estilos a menos que sea discutido previamente. Todo el diseño premium del proyecto está construido sobre CSS nativo con HSL y variables en `index.css`.
*   Mantén los componentes modulares y memoriza (`React.memo`) aquellos que realicen cálculos intensivos (ej. presupuestos).
*   Utiliza los iconos provistos por `lucide-react`.

---

¡Muchas gracias por apoyar a **MyBalance**! Tu aporte es sumamente valioso.
