package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.dto.DoctorRegisterRequest;
import AYUSH.Case.Taking.Backend.dto.PatientRegisterRequest;
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

    // =====================================================
    // PATIENT SIGNUP
    // =====================================================

    @PostMapping("/register/patient")
    public ResponseEntity<?> registerPatient(
            @RequestBody PatientRegisterRequest request
    ) {

        User registeredUser =
                authService.registerPatient(request);

        Map<String, Object> response = new HashMap<>();

        response.put("message", "Patient registration successful");
        response.put("user", Map.of(
                "id", registeredUser.getId(),
                "name", registeredUser.getName(),
                "email", registeredUser.getEmail(),
                "role", registeredUser.getRole(),
                "status", registeredUser.getStatus()
        ));

        return ResponseEntity.ok(response);
    }


    // =====================================================
    // DOCTOR SIGNUP
    // =====================================================

    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(
            @RequestBody DoctorRegisterRequest request
    ) {

        User registeredUser =
                authService.registerDoctor(request);

        Map<String, Object> response = new HashMap<>();

        response.put("message",
                "Doctor registration submitted successfully. " +
                "Your account is pending admin approval."
        );

        response.put("user", Map.of(
                "id", registeredUser.getId(),
                "name", registeredUser.getName(),
                "email", registeredUser.getEmail(),
                "role", registeredUser.getRole(),
                "status", registeredUser.getStatus()
        ));

        return ResponseEntity.ok(response);
    }


    // =====================================================
    // LOGIN
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
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

        Map<String, Object> response =
                new HashMap<>();

        response.put("message", "Login successful");
        response.put("token", token);

        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "status", user.getStatus()
        ));

        return ResponseEntity.ok(response);
    }
}