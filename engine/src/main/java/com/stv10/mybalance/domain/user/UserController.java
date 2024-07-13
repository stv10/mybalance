package com.stv10.mybalance.domain.user;

import com.stv10.mybalance.domain.person.Person;
import com.stv10.mybalance.domain.person.PersonRepository;
import com.stv10.mybalance.domain.user.dto.UserRegisterDTO;
import com.stv10.mybalance.domain.user.mapper.UserRegisterMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final PersonRepository personRepository;

    @PostMapping("/register")
    public User register(UserRegisterDTO userDto) {
        User userToSave = UserRegisterMapper.toUser(userDto);
        Person personToSave = UserRegisterMapper.toPerson(userDto);

        personRepository.save(personToSave);

        userToSave.setPersonData(personToSave);
        return userRepository.save(userToSave);
    }
}
