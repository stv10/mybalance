package com.stv10.mybalance.domain.user;

import com.stv10.mybalance.domain.person.Person;
import com.stv10.mybalance.domain.person.PersonRepository;
import com.stv10.mybalance.domain.user.dto.UserRegisterDTO;
import com.stv10.mybalance.domain.user.mapper.UserRegisterMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController()
@RequiredArgsConstructor
@RequestMapping("${protectedApiPrefix}/users")
public class UserController {
    private final UserRepository userRepository;
    private final PersonRepository personRepository;

    @PostMapping("/register")
    public User register(@RequestBody UserRegisterDTO userDto) {
        User userToSave = UserRegisterMapper.toUser(userDto);
        Person personToSave = UserRegisterMapper.toPerson(userDto);

        personRepository.save(personToSave);

        userToSave.setPersonData(personToSave);
        return userRepository.save(userToSave);
    }

    @GetMapping("/")
    public List<User> getAll() {
        return userRepository.findAll();
    }
}
