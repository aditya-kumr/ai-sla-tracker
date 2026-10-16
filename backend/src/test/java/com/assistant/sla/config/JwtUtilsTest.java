package com.assistant.sla.config;

import com.assistant.sla.model.Role;
import com.assistant.sla.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilsTest {

    @Test
    void generatesAndParsesToken() {
        JwtUtils jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "test-secret-key-that-is-at-least-32-bytes-long");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 60_000L);

        User user = User.builder()
                .id(1L)
                .email("agent@example.com")
                .fullName("Test Agent")
                .role(Role.ROLE_AGENT)
                .build();

        String token = jwtUtils.generateToken(user);

        assertTrue(jwtUtils.validateToken(token));
        assertEquals(user.getEmail(), jwtUtils.getEmailFromToken(token));
    }
}
