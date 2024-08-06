package com.stv10.mybalance.domain.account;

import com.stv10.mybalance.domain.account.dto.AccountResponseDTO;
import com.stv10.mybalance.domain.account.dto.CreateAccountDTO;
import com.stv10.mybalance.domain.user.User;
import com.stv10.mybalance.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public Optional<Account> getAccountById(String id) {
        return accountRepository.findById(id);
    }

    public AccountResponseDTO saveAccount(CreateAccountDTO createAccountDTO) {
         Account accountToSave = Account.builder()
                .icon(createAccountDTO.getIcon())
                .name(createAccountDTO.getName())
                .description(createAccountDTO.getDescription())
                .build();

         Optional<User> userToFind = userRepository.findById(createAccountDTO.getUserId());

         userToFind.ifPresent(accountToSave::setUser);

         Account accountSaved = accountRepository.save(accountToSave);

         return AccountResponseDTO.builder()
                    .id(accountSaved.getId())
                    .icon(accountSaved.getIcon())
                    .name(accountSaved.getName())
                    .description(accountSaved.getDescription())
                    .build();
    }
}
