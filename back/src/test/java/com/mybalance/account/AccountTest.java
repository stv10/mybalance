package com.mybalance.account;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class AccountTest {

    @Test
    @DisplayName("Debería acreditar saldo correctamente")
    void testCreditSuccess() {
        Account account = Account.builder()
                .name("Test Account")
                .balance(new BigDecimal("100.00"))
                .build();

        account.credit(new BigDecimal("50.50"));

        assertEquals(new BigDecimal("150.50"), account.getBalance());
    }

    @Test
    @DisplayName("Debería debitar saldo correctamente")
    void testDebitSuccess() {
        Account account = Account.builder()
                .name("Test Account")
                .balance(new BigDecimal("100.00"))
                .build();

        account.debit(new BigDecimal("30.20"));

        assertEquals(new BigDecimal("69.80"), account.getBalance());
    }

    @Test
    @DisplayName("Debería permitir saldo negativo al debitar")
    void testDebitNegativeBalanceAllowed() {
        Account account = Account.builder()
                .name("Test Account")
                .balance(new BigDecimal("10.00"))
                .build();

        account.debit(new BigDecimal("30.00"));

        assertEquals(new BigDecimal("-20.00"), account.getBalance());
    }

    @Test
    @DisplayName("Debería lanzar excepción al acreditar monto negativo")
    void testCreditNegativeAmountThrowsException() {
        Account account = Account.builder()
                .name("Test Account")
                .balance(BigDecimal.ZERO)
                .build();

        assertThrows(IllegalArgumentException.class, () -> account.credit(new BigDecimal("-10.00")));
    }

    @Test
    @DisplayName("Debería lanzar excepción al debitar monto negativo")
    void testDebitNegativeAmountThrowsException() {
        Account account = Account.builder()
                .name("Test Account")
                .balance(BigDecimal.ZERO)
                .build();

        assertThrows(IllegalArgumentException.class, () -> account.debit(new BigDecimal("-10.00")));
    }
}
