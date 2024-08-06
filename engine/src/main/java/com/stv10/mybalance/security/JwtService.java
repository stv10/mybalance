package com.stv10.mybalance.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.security.PrivateKey;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

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

    public Optional<String> getUsernameFromToken(String token) throws Exception {
        return getClaim(token, this::getSubjectFromClaims);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            Optional<String> username = getUsernameFromToken(token);
            return username.isPresent() && username.get().equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            log.error("Error getting username from token", e);
            return false;
        }
    }

    public Optional<Claims> getAllClaims(String token) throws Exception {
        return Optional.of(Jwts.parser()
                .verifyWith(keyUtils.getPublicKey()).build().parseSignedClaims(token).getBody());
    }

    public <T> T getClaim(String token, Function<Optional<Claims>,T> claimsResolver) throws Exception {
        final Optional<Claims> claims = getAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Optional<String> getSubjectFromClaims(Optional<Claims> optionalClaims) {
        return optionalClaims.flatMap(claims -> Optional.of(claims.getSubject()));
    }

    public Optional<Date> getExpirationFromClaims(Optional<Claims> optionalClaims) {
        return optionalClaims.flatMap(claims -> Optional.of(claims.getExpiration()));
    }

    public boolean isTokenExpired(String token) throws Exception {
        return getExpirationFromClaims(getAllClaims(token)).map(expiration -> expiration.before(new Date())).orElse(true);
    }
}
