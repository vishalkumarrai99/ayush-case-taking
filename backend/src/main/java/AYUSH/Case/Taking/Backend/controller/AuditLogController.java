package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.AuditLog;
import AYUSH.Case.Taking.Backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /*
     * Get complete audit history of a case.
     *
     * Accessible only by DOCTOR and ADMIN.
     */
    @GetMapping("/case/{caseId}")
    @PreAuthorize("hasAnyAuthority('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<List<AuditLog>> getCaseAuditHistory(
            @PathVariable Long caseId) {

        return ResponseEntity.ok(
                auditLogService.getCaseAuditHistory(caseId)
        );
    }

    /*
     * Get complete audit history of the logged-in patient.
     *
     * A patient can see only their own audit history.
     */
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<AuditLog>> getMyAuditHistory(
            Authentication authentication) {

        String patientEmail = authentication.getName();

        return ResponseEntity.ok(
                auditLogService.getPatientAuditHistory(patientEmail)
        );
    }

    /*
     * Get activities performed by a particular actor.
     *
     * Accessible only by ADMIN.
     */
    @GetMapping("/actor/{email}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<AuditLog>> getActorAuditHistory(
            @PathVariable String email) {

        return ResponseEntity.ok(
                auditLogService.getActorAuditHistory(email)
        );
    }
}