package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CaseService {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final AiSummaryService aiSummaryService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public CaseService(
            CaseRepository caseRepository,
            UserRepository userRepository,
            AiSummaryService aiSummaryService,
            AuditLogService auditLogService,
            NotificationService notificationService) {

        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.aiSummaryService = aiSummaryService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    /*
     * Create a new patient case.
     */
    public Case createCase(String patientEmail, Case patientCase) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        patientCase.setPatient(patient);
        patientCase.setStatus("SUBMITTED");
        patientCase.setSubmittedAt(LocalDateTime.now());

        patientCase.setAiVerified(false);
        patientCase.setDoctorVerifiedSummary(null);
        patientCase.setAiVerifiedAt(null);
        patientCase.setAiVerifiedBy(null);

        Case savedCase = caseRepository.save(patientCase);

        /*
         * Audit:
         * Patient submitted the case.
         */
        auditLogService.logAction(
                patientEmail,
                "PATIENT",
                "CASE_SUBMITTED",
                savedCase.getId(),
                "Patient submitted a new case for clinical review.",
                "status=SUBMITTED"
        );

        /*
         * Notification:
         * Inform all doctors that a new case has been submitted.
         */
        notifyAllDoctors(
                savedCase,
                "New Patient Case",
                "A new patient case has been submitted for clinical review.",
                "CASE_SUBMITTED"
        );

        generateAndSaveAiSummary(savedCase);

        return savedCase;
    }

    /*
     * Resubmit an existing rejected case after patient revision.
     *
     * The same case ID is preserved so that the complete
     * case history and audit trail remain connected.
     */
    public Case resubmitCase(
            String patientEmail,
            Long caseId,
            Case revisedCase) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Case existingCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        /*
         * Security:
         * A patient can only resubmit their own case.
         */
        if (existingCase.getPatient() == null
                || existingCase.getPatient().getId() == null
                || !existingCase.getPatient().getId().equals(patient.getId())) {

            throw new RuntimeException(
                    "You are not authorized to resubmit this case."
            );
        }

        /*
         * Only rejected cases can enter the revision flow.
         */
        if (!"REJECTED".equalsIgnoreCase(existingCase.getStatus())) {
            throw new RuntimeException(
                    "Only a rejected case can be resubmitted."
            );
        }

        /*
         * Preserve the existing case ID and patient.
         * Replace only patient-editable case sections.
         */
        existingCase.setPatientInformation(
                revisedCase.getPatientInformation()
        );

        existingCase.setChiefComplaint(
                revisedCase.getChiefComplaint()
        );

        existingCase.setMedicalHistory(
                revisedCase.getMedicalHistory()
        );

        existingCase.setAyushAssessment(
                revisedCase.getAyushAssessment()
        );

        /*
         * Reset review-related information.
         */
        existingCase.setStatus("SUBMITTED");
        existingCase.setRejectionReason(null);
        existingCase.setReviewedAt(null);

        /*
         * A revised case needs a fresh AI summary.
         */
        existingCase.setAiSummary(null);

        existingCase.setDoctorVerifiedSummary(null);
        existingCase.setAiVerified(false);
        existingCase.setAiVerifiedAt(null);
        existingCase.setAiVerifiedBy(null);

        existingCase.setSubmittedAt(LocalDateTime.now());

        Case savedCase = caseRepository.save(existingCase);

        /*
         * Audit:
         * Patient resubmitted the rejected case.
         */
        auditLogService.logAction(
                patientEmail,
                "PATIENT",
                "CASE_RESUBMITTED",
                savedCase.getId(),
                "Patient revised and resubmitted a previously rejected case.",
                "status=SUBMITTED"
        );

        /*
         * Notification:
         * Inform all doctors that the rejected case
         * has been revised and resubmitted.
         */
        notifyAllDoctors(
                savedCase,
                "Case Resubmitted",
                "A patient has revised and resubmitted a previously rejected case.",
                "CASE_RESUBMITTED"
        );

        generateAndSaveAiSummary(savedCase);

        return savedCase;
    }

    /*
     * Generate and save AI-assisted case summary.
     */
    private void generateAndSaveAiSummary(Case savedCase) {

        try {

            String aiSummary =
                    aiSummaryService.generateSummary(savedCase);

            savedCase.setAiSummary(aiSummary);

            savedCase = caseRepository.save(savedCase);

            /*
             * Audit:
             * AI summary generated successfully.
             */
            auditLogService.logAction(
                    "system",
                    "SYSTEM",
                    "AI_SUMMARY_GENERATED",
                    savedCase.getId(),
                    "AI-assisted case summary was generated.",
                    "summaryGenerated=true"
            );

        } catch (Exception e) {

            System.out.println(
                    "AI SUMMARY GENERATION FAILED: "
                            + e.getMessage()
            );

            savedCase.setAiSummary(
                    "AI summary could not be generated at this time. "
                            + "Please review the patient's structured "
                            + "case information manually."
            );

            savedCase = caseRepository.save(savedCase);

            /*
             * Audit:
             * AI summary generation failed.
             */
            auditLogService.logAction(
                    "system",
                    "SYSTEM",
                    "AI_SUMMARY_GENERATION_FAILED",
                    savedCase.getId(),
                    "AI-assisted case summary generation failed. "
                            + "Manual review is required.",
                    "summaryGenerated=false"
            );
        }
    }

    /*
     * Get all cases belonging to the logged-in patient.
     */
    public List<Case> getPatientCases(String patientEmail) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return caseRepository.findByPatient(patient);
    }

    /*
     * Get all cases.
     */
    public List<Case> getAllCases() {
        return caseRepository.findAll();
    }

    /*
     * Get cases by status.
     */
    public List<Case> getCasesByStatus(String status) {

        return caseRepository.findByStatus(
                status.toUpperCase()
        );
    }

    /*
     * Get a case by ID.
     */
    public Case getCaseById(Long id) {

        return caseRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Case not found")
                );
    }

    /*
     * Verify a patient case.
     *
     * Notification:
     * Patient is informed that the doctor has reviewed the case.
     *
     * Audit logging for CASE_VERIFIED is handled
     * by CaseController.
     */
    public Case verifyCase(Long id) {

        Case patientCase = getCaseById(id);

        patientCase.setStatus("REVIEWED");
        patientCase.setReviewedAt(LocalDateTime.now());
        patientCase.setRejectionReason(null);

        Case savedCase = caseRepository.save(patientCase);

        /*
         * Notification:
         * Inform the patient that their case has been reviewed.
         */
        notifyPatient(
                savedCase,
                "Case Reviewed",
                "Your patient case has been reviewed by the doctor.",
                "CASE_REVIEWED"
        );

        return savedCase;
    }

    /*
     * Reject a patient case.
     *
     * Notification:
     * Patient is informed that revision is required.
     *
     * Audit logging for CASE_REJECTED is handled
     * by CaseController.
     */
    public Case rejectCase(Long id, String reason) {

        Case patientCase = getCaseById(id);

        String rejectionReason =
                reason != null && !reason.isBlank()
                        ? reason
                        : "Doctor requested revision.";

        patientCase.setStatus("REJECTED");
        patientCase.setRejectionReason(rejectionReason);
        patientCase.setReviewedAt(LocalDateTime.now());

        Case savedCase = caseRepository.save(patientCase);

        /*
         * Notification:
         * Inform patient that revision is required.
         */
        notifyPatient(
                savedCase,
                "Revision Required",
                "Your patient case requires revision. Doctor's reason: "
                        + rejectionReason,
                "CASE_REJECTED"
        );

        return savedCase;
    }

    /*
     * Save doctor's notes.
     *
     * Notification:
     * Patient is informed that doctor notes were updated.
     *
     * Audit logging for DOCTOR_NOTES_SAVED is handled
     * by CaseController.
     */
    public Case saveDoctorNotes(Long id, String notes) {

        Case patientCase = getCaseById(id);

        patientCase.setDoctorNotes(
                notes != null ? notes : ""
        );

        Case savedCase = caseRepository.save(patientCase);

        /*
         * Notification:
         * Inform patient that doctor notes were updated.
         */
        notifyPatient(
                savedCase,
                "Doctor Updated Your Case",
                "The doctor has updated the notes related to your patient case.",
                "DOCTOR_NOTES_UPDATED"
        );

        return savedCase;
    }

    /*
     * Save doctor verification of the AI-generated summary.
     */
    public Case saveAiVerification(
            Long id,
            boolean verified,
            String verifiedSummary,
            String doctorEmail) {

        Case patientCase = getCaseById(id);

        if (verified) {

            String summary =
                    verifiedSummary != null
                            ? verifiedSummary.trim()
                            : "";

            if (summary.isBlank()) {
                throw new RuntimeException(
                        "Verified AI summary cannot be empty"
                );
            }

            patientCase.setDoctorVerifiedSummary(summary);
            patientCase.setAiVerified(true);
            patientCase.setAiVerifiedAt(LocalDateTime.now());
            patientCase.setAiVerifiedBy(doctorEmail);

            Case savedCase =
                    caseRepository.save(patientCase);

            /*
             * Audit:
             * Doctor verified the AI-generated summary.
             */
            auditLogService.logAction(
                    doctorEmail,
                    "DOCTOR",
                    "AI_SUMMARY_VERIFIED",
                    id,
                    "Doctor verified the AI-assisted summary.",
                    "aiVerified=true"
            );

            return savedCase;

        } else {

            patientCase.setDoctorVerifiedSummary(null);
            patientCase.setAiVerified(false);
            patientCase.setAiVerifiedAt(null);
            patientCase.setAiVerifiedBy(null);

            Case savedCase =
                    caseRepository.save(patientCase);

            /*
             * Audit:
             * Doctor removed AI verification.
             */
            auditLogService.logAction(
                    doctorEmail,
                    "DOCTOR",
                    "AI_SUMMARY_UNVERIFIED",
                    id,
                    "Doctor removed verification from the AI-assisted summary.",
                    "aiVerified=false"
            );

            return savedCase;
        }
    }

    /*
     * ---------------------------------------------------------
     * NOTIFICATION HELPERS
     * ---------------------------------------------------------
     */

    /*
     * Send a notification to all registered doctors.
     *
     * We support both:
     * DOCTOR
     * ROLE_DOCTOR
     *
     * so notification logic remains compatible with
     * different role representations.
     */
    private void notifyAllDoctors(
            Case patientCase,
            String title,
            String message,
            String type) {

        List<User> users = userRepository.findAll();

        for (User user : users) {

            if (user.getRole() == null) {
                continue;
            }

            String role = user.getRole().trim();

            if ("DOCTOR".equalsIgnoreCase(role)
                    || "ROLE_DOCTOR".equalsIgnoreCase(role)) {

                try {

                    notificationService.createNotification(
                            user,
                            patientCase,
                            title,
                            message,
                            type
                    );

                } catch (Exception e) {

                    System.out.println(
                            "DOCTOR NOTIFICATION FAILED for "
                                    + user.getEmail()
                                    + ": "
                                    + e.getMessage()
                    );
                }
            }
        }
    }

    /*
     * Send a notification to the patient who owns the case.
     */
    private void notifyPatient(
            Case patientCase,
            String title,
            String message,
            String type) {

        if (patientCase == null
                || patientCase.getPatient() == null) {

            return;
        }

        try {

            notificationService.createNotification(
                    patientCase.getPatient(),
                    patientCase,
                    title,
                    message,
                    type
            );

        } catch (Exception e) {

            System.out.println(
                    "PATIENT NOTIFICATION FAILED: "
                            + e.getMessage()
            );
        }
    }
}