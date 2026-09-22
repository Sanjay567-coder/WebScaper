package com.example.webscraper;

import com.example.webscraper.dto.request.AuthRequest;
import com.example.webscraper.dto.response.AuthResponse;
import com.example.webscraper.entity.User;
import com.example.webscraper.entity.enums.UserRole;
import com.example.webscraper.repository.UserRepository;
import com.example.webscraper.security.JwtTokenProvider;
import com.example.webscraper.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, tokenProvider);
    }

    @Test
    @DisplayName("Should successfully authenticate valid admin credentials and return JWT token")
    void testAuthenticateUser() {
        AuthRequest request = new AuthRequest("admin@webscraper.local", "Admin@123");
        Authentication authMock = mock(Authentication.class);

        User user = User.builder()
                .id(1L)
                .name("Admin")
                .email("admin@webscraper.local")
                .passwordHash("hashed_pass")
                .role(UserRole.ROLE_ADMIN)
                .createdAt(LocalDateTime.now())
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authMock);
        when(tokenProvider.generateToken(authMock)).thenReturn("mocked-jwt-token");
        when(tokenProvider.getExpirationMs()).thenReturn(86400000L);
        when(userRepository.findByEmail("admin@webscraper.local")).thenReturn(Optional.of(user));

        AuthResponse response = authService.authenticateUser(request);

        assertNotNull(response);
        assertEquals("mocked-jwt-token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertNotNull(response.getUser());
        assertEquals("admin@webscraper.local", response.getUser().getEmail());
        assertEquals(UserRole.ROLE_ADMIN, response.getUser().getRole());
    }
}
