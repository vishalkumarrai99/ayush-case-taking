package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // =========================================================
    // GET PENDING DOCTORS
    // =========================================================

    @GetMapping("/doctors/pending")
    public ResponseEntity<?> getPendingDoctors() {

        List<Map<String, Object>> doctors =
                adminService.getPendingDoctors();

        return ResponseEntity.ok(doctors);
    }

    // =========================================================
    // APPROVE DOCTOR
    // =========================================================

    @PutMapping("/doctors/{userId}/approve")
    public ResponseEntity<?> approveDoctor(
            @PathVariable Long userId,
            Authentication authentication
    ) {

        String adminEmail =
                authentication != null
                        ? authentication.getName()
                        : "admin";

        return ResponseEntity.ok(
                adminService.approveDoctor(
                        userId,
                        adminEmail
                )
        );
    }

    // =========================================================
    // REJECT DOCTOR
    // =========================================================

    @PutMapping("/doctors/{userId}/reject")
    public ResponseEntity<?> rejectDoctor(
            @PathVariable Long userId,
            @RequestBody(required = false)
            Map<String, String> request,
            Authentication authentication
    ) {

        String adminEmail =
                authentication != null
                        ? authentication.getName()
                        : "admin";

        String reason = null;

        if (request != null) {
            reason = request.get("reason");
        }

        return ResponseEntity.ok(
                adminService.rejectDoctor(
                        userId,
                        adminEmail,
                        reason
                )
        );
    }

    // =========================================================
    // ADMIN DASHBOARD HEALTH CHECK
    // =========================================================

    @GetMapping("/health")
    public ResponseEntity<?> adminHealth() {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "status",
                "ADMIN_API_ACTIVE"
        );

        return ResponseEntity.ok(response);
    }
}