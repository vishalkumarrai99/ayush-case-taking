package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.service.AuditLogService;
import AYUSH.Case.Taking.Backend.service.CaseService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseService caseService;
    private final AuditLogService auditLogService;

    public CaseController(
            CaseService caseService,
            AuditLogService auditLogService) {

        this.caseService = caseService;
        this.auditLogService = auditLogService;
    }

    /*
     * Patient submits a new case.
     */
    @PostMapping
    public ResponseEntity<Case> createCase(
            @RequestBody Case patientCase,
            Authentication authentication) {

        String patientEmail = authentication.getName();

        Case savedCase =
                caseService.createCase(
                        patientEmail,
                        patientCase
                );

        return ResponseEntity.ok(savedCase);
    }

    /*
     * Get all cases belonging to the logged-in patient.
     */
    @GetMapping("/my")
    public ResponseEntity<List<Case>> getMyCases(
            Authentication authentication) {

        String patientEmail = authentication.getName();

        return ResponseEntity.ok(
                caseService.getPatientCases(patientEmail)
        );
    }

    /*
     * Resubmit a previously rejected case.
     *
     * The same case ID is preserved.
     */
    @PutMapping("/{id}/resubmit")
    public ResponseEntity<Case> resubmitCase(
            @PathVariable Long id,
            @RequestBody Case revisedCase,
            Authentication authentication) {

        String patientEmail = authentication.getName();

        Case savedCase =
                caseService.resubmitCase(
                        patientEmail,
                        id,
                        revisedCase
                );

        return ResponseEntity.ok(savedCase);
    }

    /*
     * Get a single case by ID.
     *
     * Every time a user opens a case,
     * an audit record is created.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Case> getCaseById(
            @PathVariable Long id,
            Authentication authentication) {

        Case patientCase =
                caseService.getCaseById(id);

        String actorEmail =
                authentication.getName();

        String actorRole =
                getActorRole(authentication);

        /*
         * Log case access.
         */
        auditLogService.logAction(
                actorEmail,
                actorRole,
                "CASE_OPENED",
                id,
                "Case was opened for review.",
                "accessType=CASE_VIEW"
        );

        return ResponseEntity.ok(patientCase);
    }

    /*
     * Get all cases.
     */
    @GetMapping
    public ResponseEntity<List<Case>> getAllCases() {

        return ResponseEntity.ok(
                caseService.getAllCases()
        );
    }

    /*
     * Get cases by status.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Case>> getCasesByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                caseService.getCasesByStatus(status)
        );
    }

    /*
     * Doctor verifies a case.
     */
    @PutMapping("/{id}/verify")
    public ResponseEntity<Case> verifyCase(
            @PathVariable Long id,
            Authentication authentication) {

        Case savedCase =
                caseService.verifyCase(id);

        String doctorEmail =
                authentication.getName();

        /*
         * Log actual doctor's activity.
         */
        auditLogService.logAction(
                doctorEmail,
                "DOCTOR",
                "CASE_VERIFIED",
                id,
                "Doctor verified the patient case.",
                "status=REVIEWED"
        );

        return ResponseEntity.ok(savedCase);
    }

    /*
     * Doctor rejects a case.
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Case> rejectCase(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String reason =
                request.get("reason");

        Case savedCase =
                caseService.rejectCase(
                        id,
                        reason
                );

        String doctorEmail =
                authentication.getName();

        /*
         * Do not store the complete rejection reason
         * in audit metadata because it may contain
         * unnecessary clinical information.
         */
        auditLogService.logAction(
                doctorEmail,
                "DOCTOR",
                "CASE_REJECTED",
                id,
                "Doctor rejected the patient case and requested revision.",
                "status=REJECTED"
        );

        return ResponseEntity.ok(savedCase);
    }

    /*
     * Doctor saves notes.
     */
    @PutMapping("/{id}/notes")
    public ResponseEntity<Case> saveDoctorNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String notes =
                request.get("notes");

        Case savedCase =
                caseService.saveDoctorNotes(
                        id,
                        notes
                );

        String doctorEmail =
                authentication.getName();

        /*
         * We do not put the actual medical notes
         * into audit metadata.
         */
        auditLogService.logAction(
                doctorEmail,
                "DOCTOR",
                "DOCTOR_NOTES_SAVED",
                id,
                "Doctor updated clinical notes for the case.",
                "notesUpdated=true"
        );

        return ResponseEntity.ok(savedCase);
    }

    /*
     * Doctor verifies or removes verification
     * from the AI-generated summary.
     */
    @PutMapping("/{id}/ai-verification")
    public ResponseEntity<Case> saveAiVerification(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        boolean verified =
                Boolean.TRUE.equals(
                        request.get("verified")
                );

        String verifiedSummary =
                request.get("verifiedSummary") != null
                        ? String.valueOf(
                                request.get("verifiedSummary")
                        )
                        : "";

        String doctorEmail =
                authentication.getName();

        Case savedCase =
                caseService.saveAiVerification(
                        id,
                        verified,
                        verifiedSummary,
                        doctorEmail
                );

        return ResponseEntity.ok(savedCase);
    }

    /*
     * Extract the application role from Spring Security.
     *
     * JWT authority is normally:
     * ROLE_PATIENT
     * ROLE_DOCTOR
     * ROLE_ADMIN
     */
    private String getActorRole(
            Authentication authentication) {

        if (authentication == null
                || authentication.getAuthorities() == null) {

            return "UNKNOWN";
        }

        return authentication.getAuthorities()
                .stream()
                .findFirst()
                .map(authority -> {

                    String value =
                            authority.getAuthority();

                    if (value.startsWith("ROLE_")) {
                        return value.substring(5);
                    }

                    return value;
                })
                .orElse("UNKNOWN");
    }
}