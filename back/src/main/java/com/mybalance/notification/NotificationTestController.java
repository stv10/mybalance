package com.mybalance.notification;

import com.mybalance.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Profile("dev")
public class NotificationTestController {

    private final EmailService emailService;

    /**
     * Endpoint de prueba para verificar el envío de correos electrónicos.
     * Solo disponible cuando el perfil 'dev' está activo.
     */
    @PostMapping("/test-email")
    public ResponseEntity<ApiResponse<String>> testEmail(@RequestParam String to) {
        String subject = "✉️ Prueba de Envío — MyBalance Dev";
        String body = "¡Hola!\n\nEste es un correo de prueba enviado desde tu entorno local de desarrollo de MyBalance.\n\nSi estás recibiendo esto en tu Mailhog/Mailpit local (o en tu bandeja real si configuraste credenciales de Resend), significa que la integración SMTP está funcionando perfectamente.\n\nSaludos,\nEl equipo de MyBalance.";
        
        emailService.sendEmail(to, subject, body);
        return ResponseEntity.ok(ApiResponse.ok("Correo de prueba enviado exitosamente a: " + to));
    }
}
