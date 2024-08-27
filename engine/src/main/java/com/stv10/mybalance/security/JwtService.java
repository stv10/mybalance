package com.stv10.mybalance.security;

import com.stv10.mybalance.domain.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {
    private final KeyUtils keyUtils;

    public String generateToken(User user) {
        HashMap<String, Object> extra = new HashMap<>();
        extra.put("role", user.getRole());
        extra.put("id", user.getId());
        extra.put("email", user.getEmail());
        return getToken(extra, user);
    }

    private String getToken(Map<String,Object> extra, User user) {

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
                .verifyWith(keyUtils.getPublicKey()).build().parseSignedClaims(token).getPayload());
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
