package com.stv10.mybalance.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import java.security.PrivateKey;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;

public class JwtUtils {

    private final PrivateKey privateKey;

    public JwtUtils(PrivateKey privateKey) {
        this.privateKey = privateKey;
    }

    public String generateToken(String subject, Map<String, Object> extra) {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.YEAR, 1);

        Claims claims = Jwts.claims().subject(subject).build();
        claims.putAll(extra);

        return Jwts.builder()
                .claims(claims)
                .issuedAt(new Date())
                .expiration(calendar.getTime())
                .signWith(privateKey)
                .compact();
    }
}

