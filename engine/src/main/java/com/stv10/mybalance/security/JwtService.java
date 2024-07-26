package com.stv10.mybalance.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.security.PrivateKey;
import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {
    private final KeyUtils keyUtils;

    public String generateToken(UserDetails user) {
        return getToken(Map.of(), user);
    }

    private String getToken(Map<String,Object> extra, UserDetails user) {

        try {
            PrivateKey privateKey = keyUtils.getPrivateKey();
            JwtUtils jwtUtils = new JwtUtils(privateKey);
            return jwtUtils.generateToken(user.getUsername(), extra);
        } catch (Exception e) {
            log.error("Error generating token", e);
        }
        return null;
    }
}
