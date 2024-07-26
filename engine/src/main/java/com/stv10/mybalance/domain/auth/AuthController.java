package com.stv10.mybalance.domain.auth;

import com.stv10.mybalance.domain.login.dto.AuthResponseDTO;
import com.stv10.mybalance.domain.login.dto.LoginRequestDTO;
import com.stv10.mybalance.domain.login.dto.RegisterRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${publicApiPrefix}/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        ResponseEntity<?> response;

        try {
            response = ResponseEntity.ok(authService.login(request));
        } catch (Exception ex) {
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + ex.getMessage());
        }

        return response;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        ResponseEntity<?> response;
        try {
            response = ResponseEntity.ok(authService.register(request));
        } catch (Exception ex) {
            response = ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + ex.getMessage());
        }

        return response;
    }

}
