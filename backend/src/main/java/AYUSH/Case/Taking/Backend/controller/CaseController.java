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
            AuditLogService auditLogService
    ) {
        this.caseService = caseService;
        this.auditLogService = auditLogService;
    }

    // ============================================================
    // PATIENT - CREATE CASE
    // ============================================================

    @PostMapping
    public ResponseEntity<Case> createCase(
            @RequestBody Case patientCase,
            Authentication authentication
    ) {

        String patientEmail = authentication.getName();

        Case savedCase = caseService.createCase(
                patientEmail,
                patientCase
        );

        return ResponseEntity.ok(savedCase);
    }

    // ============================================================
    // PATIENT - MY CASES
    // ============================================================

    @GetMapping("/my")
    public ResponseEntity<List<Case>> getMyCases(
            Authentication authentication
    ) {

        String patientEmail = authentication.getName();

        return ResponseEntity.ok(
                caseService.getPatientCases(patientEmail)
        );
    }

    // ============================================================
    // DOCTOR - ASSIGNED CASES
    // ============================================================

    @GetMapping("/assigned")
    public ResponseEntity<List<Case>> getAssignedCases(
            Authentication authentication
    ) {

        String doctorEmail = authentication.getName();

        return ResponseEntity.ok(
                caseService.getDoctorCases(doctorEmail)
        );
    }

    // ============================================================
    // DOCTOR - ASSIGNED CASES BY STATUS
    // ============================================================

    @GetMapping("/assigned/status/{status}")
    public ResponseEntity<List<Case>> getAssignedCasesByStatus(
            @PathVariable String status,
            Authentication authentication
    ) {

        String doctorEmail = authentication.getName();

        return ResponseEntity.ok(
                caseService.getDoctorCasesByStatus(
                        doctorEmail,
                        status
                )
        );
    }

    // ============================================================
    // PATIENT - RESUBMIT CASE
    // ============================================================

    @PutMapping("/{id}/resubmit")
    public ResponseEntity<Case> resubmitCase(
            @PathVariable Long id,
            @RequestBody Case revisedCase,
            Authentication authentication
    ) {

        String patientEmail = authentication.getName();

        Case savedCase = caseService.resubmitCase(
                patientEmail,
                id,
                revisedCase
        );

        return ResponseEntity.ok(savedCase);
    }

    // ============================================================
    // SECURE GET CASE
    // PATIENT -> ONLY OWN CASE
    // DOCTOR  -> ONLY ASSIGNED CASE
    // ADMIN   -> ANY CASE
    // ============================================================

    @GetMapping("/{id}")
    public ResponseEntity<Case> getCaseById(
            @PathVariable Long id,
            Authentication authentication
    ) {

        String actorEmail = authentication.getName();
        String actorRole = getActorRole(authentication);

        Case patientCase = caseService.getCaseByIdForUser(
                id,
                actorEmail,
                actorRole
        );

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

    // ============================================================
    // CASE LIST
    //
    // ADMIN   -> ALL CASES
    // DOCTOR  -> ONLY ASSIGNED CASES
    //
    // This keeps /api/cases compatible with the existing
    // Doctor Dashboard while preventing doctors from seeing
    // unassigned patients.
    // ============================================================

    @GetMapping
    public ResponseEntity<List<Case>> getCases(
            Authentication authentication
    ) {

        String actorEmail = authentication.getName();
        String actorRole = getActorRole(authentication);

        if ("DOCTOR".equalsIgnoreCase(actorRole)) {

            return ResponseEntity.ok(
                    caseService.getDoctorCases(actorEmail)
            );
        }

        if ("ADMIN".equalsIgnoreCase(actorRole)) {

            return ResponseEntity.ok(
                    caseService.getAllCases()
            );
        }

        return ResponseEntity.status(403).build();
    }

    // ============================================================
    // CASES BY STATUS
    //
    // ADMIN   -> ALL CASES WITH STATUS
    // DOCTOR  -> ONLY ASSIGNED CASES WITH STATUS
    // ============================================================

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Case>> getCasesByStatus(
            @PathVariable String status,
            Authentication authentication
    ) {

        String actorEmail = authentication.getName();
        String actorRole = getActorRole(authentication);

        if ("DOCTOR".equalsIgnoreCase(actorRole)) {

            return ResponseEntity.ok(
                    caseService.getDoctorCasesByStatus(
                            actorEmail,
                            status
                    )
            );
        }

        if ("ADMIN".equalsIgnoreCase(actorRole)) {

            return ResponseEntity.ok(
                    caseService.getCasesByStatus(status)
            );
        }

        return ResponseEntity.status(403).build();
    }

    // ============================================================
    // DOCTOR - VERIFY CASE
    // ============================================================

    @PutMapping("/{id}/verify")
    public ResponseEntity<Case> verifyCase(
            @PathVariable Long id,
            Authentication authentication
    ) {

        String doctorEmail = authentication.getName();

        Case savedCase = caseService.verifyCase(
                id,
                doctorEmail
        );

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

    // ============================================================
    // DOCTOR - REJECT CASE
    // ============================================================

    @PutMapping("/{id}/reject")
    public ResponseEntity<Case> rejectCase(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {

        String reason = request.get("reason");
        String doctorEmail = authentication.getName();

        Case savedCase = caseService.rejectCase(
                id,
                reason,
                doctorEmail
        );

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

    // ============================================================
    // DOCTOR - SAVE NOTES
    // ============================================================

    @PutMapping("/{id}/notes")
    public ResponseEntity<Case> saveDoctorNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {

        String notes = request.get("notes");
        String doctorEmail = authentication.getName();

        Case savedCase = caseService.saveDoctorNotes(
                id,
                notes,
                doctorEmail
        );

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

    // ============================================================
    // DOCTOR - AI VERIFICATION
    // ============================================================

    @PutMapping("/{id}/ai-verification")
    public ResponseEntity<Case> saveAiVerification(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {

        boolean verified = Boolean.TRUE.equals(
                request.get("verified")
        );

        String verifiedSummary =
                request.get("verifiedSummary") != null
                        ? String.valueOf(
                                request.get("verifiedSummary")
                        )
                        : "";

        String doctorEmail = authentication.getName();

        Case savedCase = caseService.saveAiVerification(
                id,
                verified,
                verifiedSummary,
                doctorEmail
        );

        return ResponseEntity.ok(savedCase);
    }

    // ============================================================
    // HELPER - GET NORMALIZED ROLE
    // ============================================================

    private String getActorRole(Authentication authentication) {

        if (authentication == null) {
            return "UNKNOWN";
        }

        if (authentication.getAuthorities() == null) {
            return "UNKNOWN";
        }

        return authentication.getAuthorities()
                .stream()
                .findFirst()
                .map(authority -> {

                    String value = authority.getAuthority();

                    if (value == null) {
                        return "UNKNOWN";
                    }

                    if (value.startsWith("ROLE_")) {
                        return value.substring(5).toUpperCase();
                    }

                    return value.toUpperCase();
                })
                .orElse("UNKNOWN");
    }
}