package com.stv10.mybalance.domain.auth;

import com.stv10.mybalance.domain.auth.dto.AuthResponseDTO;
import com.stv10.mybalance.domain.auth.dto.LoginRequestDTO;
import com.stv10.mybalance.domain.auth.dto.RegisterRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${publicApiPrefix}/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        ResponseEntity<AuthResponseDTO> response;

        try {
            response = ResponseEntity.ok(authService.login(request));
        } catch (Exception ex) {
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).body(AuthResponseDTO.builder().message("Error: " + ex.getMessage()).build());
        }

        return response;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO request) {
        ResponseEntity<AuthResponseDTO> response;
        try {
            response = ResponseEntity.ok(authService.register(request));
        } catch (Exception ex) {
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).body(AuthResponseDTO.builder().message("Error: " + ex.getMessage()).build());
        }

        return response;
    }

}
