package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.PatientConsent;
import AYUSH.Case.Taking.Backend.service.PatientConsentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consents")
public class PatientConsentController {

    private final PatientConsentService patientConsentService;

    public PatientConsentController(PatientConsentService patientConsentService) {
        this.patientConsentService = patientConsentService;
    }

    @PostMapping
    public ResponseEntity<PatientConsent> saveConsent(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        String patientEmail = authentication.getName();

        Long caseId = null;

        if (request.get("caseId") != null) {
            caseId = Long.valueOf(String.valueOf(request.get("caseId")));
        }

        String consentVersion =
                request.get("consentVersion") != null
                        ? String.valueOf(request.get("consentVersion"))
                        : null;

        Boolean consentGiven =
                request.get("consentGiven") != null
                        ? Boolean.valueOf(String.valueOf(request.get("consentGiven")))
                        : false;

        String consentScope =
                request.get("consentScope") != null
                        ? String.valueOf(request.get("consentScope"))
                        : null;

        LocalDateTime consentAt = parseConsentDateTime(request.get("consentAt"));

        PatientConsent savedConsent = patientConsentService.saveConsent(
                patientEmail,
                caseId,
                consentVersion,
                consentGiven,
                consentScope,
                consentAt
        );

        return ResponseEntity.ok(savedConsent);
    }

    @GetMapping("/my")
    public ResponseEntity<List<PatientConsent>> getMyConsents(
            Authentication authentication) {

        String patientEmail = authentication.getName();

        return ResponseEntity.ok(
                patientConsentService.getMyConsents(patientEmail)
        );
    }

    @GetMapping("/my/latest")
    public ResponseEntity<PatientConsent> getLatestConsent(
            Authentication authentication) {

        String patientEmail = authentication.getName();

        PatientConsent latestConsent =
                patientConsentService.getLatestConsent(patientEmail);

        if (latestConsent == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(latestConsent);
    }

    private LocalDateTime parseConsentDateTime(Object value) {

        if (value == null) {
            return LocalDateTime.now();
        }

        String dateTimeValue = String.valueOf(value).trim();

        if (dateTimeValue.isBlank()) {
            return LocalDateTime.now();
        }

        try {
            /*
             * Handles frontend JavaScript ISO format:
             *
             * 2026-09-06T18:30:00.000Z
             */
            return OffsetDateTime.parse(dateTimeValue).toLocalDateTime();

        } catch (Exception ignored) {
            // Try LocalDateTime format below
        }

        try {
            /*
             * Handles:
             *
             * 2026-09-06T18:30:00
             */
            return LocalDateTime.parse(dateTimeValue);

        } catch (Exception ignored) {
            throw new IllegalArgumentException(
                    "Invalid consentAt format. Expected ISO date-time format."
            );
        }
    }
}