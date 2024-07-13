package com.stv10.mybalance.domain.user.mapper;

import com.stv10.mybalance.domain.person.Person;
import com.stv10.mybalance.domain.user.User;
import com.stv10.mybalance.domain.user.dto.UserRegisterDTO;

public class UserRegisterMapper {

    public static User toUser(UserRegisterDTO userDto) {
        if(userDto == null) return null;

        return User.builder()
                .email(userDto.getEmail())
                .password(userDto.getPassword())
                .build();
    }

    public static Person toPerson(UserRegisterDTO userDto) {
        if(userDto == null) return null;

        return Person.builder()
                .name(userDto.getName())
                .lastName(userDto.getLastName())
                .build();
    }
}
