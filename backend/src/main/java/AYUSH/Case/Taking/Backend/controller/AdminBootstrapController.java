package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.service.AdminBootstrapService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AdminBootstrapController {

    private final AdminBootstrapService adminBootstrapService;

    public AdminBootstrapController(
            AdminBootstrapService adminBootstrapService
    ) {
        this.adminBootstrapService = adminBootstrapService;
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerFirstAdmin(
            @RequestBody Map<String, String> request
    ) {

        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");

        User admin = adminBootstrapService.registerFirstAdmin(
                name,
                email,
                password
        );

        Map<String, Object> response = new HashMap<>();

        response.put(
                "message",
                "Admin registration successful"
        );

        response.put(
                "user",
                Map.of(
                        "id", admin.getId(),
                        "name", admin.getName(),
                        "email", admin.getEmail(),
                        "role", admin.getRole(),
                        "status", admin.getStatus()
                )
        );

        return ResponseEntity.ok(response);
    }
}