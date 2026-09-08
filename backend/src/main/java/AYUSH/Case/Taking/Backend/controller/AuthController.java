package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // =========================
    // REGISTER API
    // =========================

    @PostMapping("/register")
    public ResponseEntity<User> register(
            @RequestBody User user
    ) {

        User registeredUser =
                authService.registerUser(user);

        return ResponseEntity.ok(registeredUser);
    }

    // =========================
    // LOGIN API
    // =========================

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> loginRequest
    ) {

        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        // Verify credentials and generate JWT
        String token =
                authService.loginUser(email, password);

        // Get logged-in user
        User user =
                authService.getUserByEmail(email);

        // Prepare response
        Map<String, Object> response =
                new HashMap<>();

        response.put("message", "Login successful");

        response.put("token", token);

        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));

        return ResponseEntity.ok(response);
    }
}