package com.stv10.mybalance.domain.auth;

import com.stv10.mybalance.domain.login.dto.AuthResponseDTO;
import com.stv10.mybalance.domain.login.dto.LoginRequestDTO;
import com.stv10.mybalance.domain.login.dto.RegisterRequestDTO;
import com.stv10.mybalance.domain.person.Person;
import com.stv10.mybalance.domain.user.User;
import com.stv10.mybalance.domain.user.UserRepository;
import com.stv10.mybalance.domain.user.enums.Role;
import com.stv10.mybalance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthResponseDTO register(RegisterRequestDTO registerRequest) {
        Person person = Person.builder()
                .name(registerRequest.getName())
                .lastName(registerRequest.getLastName())
                .fullName(registerRequest.getName() + " " + registerRequest.getLastName())
                .id(ObjectId.get().toHexString())
                .build();


        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(registerRequest.getPassword())
                .email(registerRequest.getEmail().orElse(null))
                .role(Role.valueOf(registerRequest.getRole()))
                .personData(person)
                .build();

        userRepository.save(user);

        return AuthResponseDTO.builder()
                .token(jwtService.generateToken(user))
                .build();
    }

    public AuthResponseDTO login(LoginRequestDTO loginRequest) {
        return AuthResponseDTO.builder().token("token").build();
    }
}
