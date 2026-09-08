package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.PatientConsent;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;
import AYUSH.Case.Taking.Backend.repository.PatientConsentRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PatientConsentService {

    private final PatientConsentRepository patientConsentRepository;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final AuditLogService auditLogService;

    public PatientConsentService(
            PatientConsentRepository patientConsentRepository,
            UserRepository userRepository,
            CaseRepository caseRepository,
            AuditLogService auditLogService) {

        this.patientConsentRepository = patientConsentRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
        this.auditLogService = auditLogService;
    }

    /*
     * Save patient consent.
     */
    public PatientConsent saveConsent(
            String patientEmail,
            Long caseId,
            String consentVersion,
            Boolean consentGiven,
            String consentScope,
            LocalDateTime consentAt) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(
                        () -> new RuntimeException("Patient not found")
                );

        /*
         * Consent must explicitly be given.
         */
        if (!Boolean.TRUE.equals(consentGiven)) {

            throw new RuntimeException(
                    "Consent must be given before saving patient consent."
            );
        }

        /*
         * Consent version is mandatory so that we know
         * which version of the consent text was accepted.
         */
        if (consentVersion == null
                || consentVersion.isBlank()) {

            throw new RuntimeException(
                    "Consent version is required."
            );
        }

        /*
         * Consent scope is mandatory.
         */
        if (consentScope == null
                || consentScope.isBlank()) {

            throw new RuntimeException(
                    "Consent scope is required."
            );
        }

        PatientConsent consent =
                new PatientConsent();

        consent.setPatient(patient);

        /*
         * At the time of initial consent, caseId can be null
         * because the frontend gives consent before creating
         * the actual case.
         *
         * If a case ID is provided, attach the consent to that case.
         */
        if (caseId != null) {

            Case patientCase =
                    caseRepository.findById(caseId)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "Case not found"
                                    )
                            );

            consent.setPatientCase(patientCase);
        }

        consent.setConsentVersion(consentVersion);
        consent.setConsentGiven(true);
        consent.setConsentScope(consentScope);

        consent.setConsentAt(
                consentAt != null
                        ? consentAt
                        : LocalDateTime.now()
        );

        consent.setCreatedAt(
                LocalDateTime.now()
        );

        PatientConsent savedConsent =
                patientConsentRepository.save(consent);

        /*
         * Audit Trail
         *
         * Record that the patient explicitly gave consent.
         *
         * We intentionally do NOT store the complete consent
         * text or medical information in audit metadata.
         */
        auditLogService.logAction(
                patientEmail,
                "PATIENT",
                "CONSENT_GIVEN",
                caseId,
                "Patient provided consent for case-taking and healthcare data processing.",
                "consentVersion=" + consentVersion
                        + ";consentGiven=true"
        );

        return savedConsent;
    }

    /*
     * Get all consents belonging to the logged-in patient.
     */
    public List<PatientConsent> getMyConsents(
            String patientEmail) {

        User patient =
                userRepository.findByEmail(patientEmail)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Patient not found"
                                )
                        );

        return patientConsentRepository
                .findByPatient(patient);
    }

    /*
     * Get the latest consent of the patient.
     */
    public PatientConsent getLatestConsent(
            String patientEmail) {

        User patient =
                userRepository.findByEmail(patientEmail)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Patient not found"
                                )
                        );

        return patientConsentRepository
                .findTopByPatientOrderByConsentAtDesc(patient)
                .orElse(null);
    }
}