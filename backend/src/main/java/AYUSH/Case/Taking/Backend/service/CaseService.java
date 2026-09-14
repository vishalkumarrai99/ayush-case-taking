package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Appointment;
import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.AppointmentRepository;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CaseService {

    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final AiSummaryService aiSummaryService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public CaseService(
            CaseRepository caseRepository,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            AiSummaryService aiSummaryService,
            AuditLogService auditLogService,
            NotificationService notificationService
    ) {
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.aiSummaryService = aiSummaryService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    // ============================================================
    // CREATE CASE
    // ============================================================

    public Case createCase(
            String patientEmail,
            Case patientCase
    ) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Patient not found"
                        )
                );

        // ========================================================
        // APPOINTMENT IS REQUIRED
        // ========================================================

        Long appointmentId = patientCase.getAppointmentId();

        if (appointmentId == null) {

            throw new RuntimeException(
                    "Appointment is required before submitting a case."
            );
        }

        Appointment appointment =
                appointmentRepository.findById(appointmentId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Appointment not found"
                                )
                        );

        // ========================================================
        // APPOINTMENT OWNERSHIP CHECK
        // ========================================================

        if (
                appointment.getPatient() == null
                        || appointment.getPatient().getId() == null
                        || !appointment.getPatient()
                        .getId()
                        .equals(patient.getId())
        ) {

            throw new RuntimeException(
                    "You are not authorized to use this appointment."
            );
        }

        // ========================================================
        // APPOINTMENT STATUS CHECK
        // ========================================================

        if (
                !"CONFIRMED".equalsIgnoreCase(
                        appointment.getStatus()
                )
        ) {

            throw new RuntimeException(
                    "Only a confirmed appointment can be used for case taking."
            );
        }

        // ========================================================
        // APPOINTMENT DOCTOR CHECK
        // ========================================================

        User assignedDoctor =
                appointment.getDoctor();

        if (assignedDoctor == null) {

            throw new RuntimeException(
                    "No doctor is linked with this appointment."
            );
        }

        if (
                !"DOCTOR".equalsIgnoreCase(
                        safeRole(assignedDoctor)
                )
        ) {

            throw new RuntimeException(
                    "The appointment is not linked to a valid doctor."
            );
        }

        if (
                !"APPROVED".equalsIgnoreCase(
                        safeStatus(assignedDoctor)
                )
        ) {

            throw new RuntimeException(
                    "The selected doctor is no longer approved."
            );
        }

        // ========================================================
        // ONE CASE PER APPOINTMENT
        // ========================================================

        if (
                caseRepository.existsByAppointment_Id(
                        appointmentId
                )
        ) {

            throw new RuntimeException(
                    "A case has already been created for this appointment."
            );
        }

        // ========================================================
        // SET SERVER-SIDE VALUES
        // ========================================================

        patientCase.setPatient(patient);

        /*
         * IMPORTANT:
         * Doctor comes from the appointment.
         * Patient cannot control doctor assignment through
         * the incoming Case JSON.
         */
        patientCase.setDoctor(assignedDoctor);

        patientCase.setAppointment(appointment);

        patientCase.setStatus("SUBMITTED");

        patientCase.setSubmittedAt(
                LocalDateTime.now()
        );

        patientCase.setAiVerified(false);

        patientCase.setDoctorVerifiedSummary(null);

        patientCase.setAiVerifiedAt(null);

        patientCase.setAiVerifiedBy(null);

        patientCase.setReviewedAt(null);

        patientCase.setRejectionReason(null);

        // ========================================================
        // SAVE CASE
        // ========================================================

        Case savedCase =
                caseRepository.save(patientCase);

        // ========================================================
        // AUDIT LOG
        // ========================================================

        auditLogService.logAction(
                patientEmail,
                "PATIENT",
                "CASE_SUBMITTED",
                savedCase.getId(),
                "Patient submitted a new case for clinical review.",
                "status=SUBMITTED,appointmentId="
                        + appointmentId
                        + ",doctorAssigned=true"
        );

        // ========================================================
        // NOTIFY SELECTED DOCTOR
        // ========================================================

        notifyDoctor(
                savedCase,
                assignedDoctor,
                "New Patient Case",
                "A new patient case has been assigned to you through appointment #"
                        + appointmentId
                        + " for clinical review.",
                "CASE_ASSIGNED"
        );

        // ========================================================
        // AI SUMMARY
        // ========================================================

        generateAndSaveAiSummary(
                savedCase
        );

        return savedCase;
    }

    // ============================================================
    // RESUBMIT CASE
    // ============================================================

    public Case resubmitCase(
            String patientEmail,
            Long caseId,
            Case revisedCase
    ) {

        User patient =
                userRepository.findByEmail(patientEmail)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Patient not found"
                                )
                        );

        Case existingCase =
                caseRepository.findById(caseId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Case not found"
                                )
                        );

        // ========================================================
        // PATIENT OWNERSHIP CHECK
        // ========================================================

        if (
                existingCase.getPatient() == null
                        || existingCase.getPatient().getId() == null
                        || !existingCase.getPatient()
                        .getId()
                        .equals(patient.getId())
        ) {

            throw new RuntimeException(
                    "You are not authorized to resubmit this case."
            );
        }

        // ========================================================
        // ONLY REJECTED CASE CAN BE RESUBMITTED
        // ========================================================

        if (
                !"REJECTED".equalsIgnoreCase(
                        existingCase.getStatus()
                )
        ) {

            throw new RuntimeException(
                    "Only a rejected case can be resubmitted."
            );
        }

        // ========================================================
        // UPDATE PATIENT INFORMATION
        // ========================================================

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

        // ========================================================
        // RESET REVIEW / AI STATE
        // ========================================================

        existingCase.setStatus(
                "SUBMITTED"
        );

        existingCase.setRejectionReason(
                null
        );

        existingCase.setReviewedAt(
                null
        );

        existingCase.setAiSummary(
                null
        );

        existingCase.setDoctorVerifiedSummary(
                null
        );

        existingCase.setAiVerified(
                false
        );

        existingCase.setAiVerifiedAt(
                null
        );

        existingCase.setAiVerifiedBy(
                null
        );

        existingCase.setSubmittedAt(
                LocalDateTime.now()
        );

        // ========================================================
        // KEEP THE SAME APPOINTMENT + DOCTOR
        // ========================================================

        Appointment appointment =
                existingCase.getAppointment();

        User assignedDoctor =
                existingCase.getDoctor();

        /*
         * A rejected case that belongs to an appointment
         * must continue with the same appointment and doctor.
         */
        if (appointment != null) {

            if (
                    appointment.getPatient() == null
                            || appointment.getPatient().getId() == null
                            || !appointment.getPatient()
                            .getId()
                            .equals(patient.getId())
            ) {

                throw new RuntimeException(
                        "The appointment linked with this case does not belong to you."
                );
            }

            if (
                    !"CONFIRMED".equalsIgnoreCase(
                            appointment.getStatus()
                    )
            ) {

                throw new RuntimeException(
                        "The appointment linked with this case is no longer confirmed."
                );
            }

            assignedDoctor =
                    appointment.getDoctor();

            if (
                    assignedDoctor == null
                            || !"DOCTOR".equalsIgnoreCase(
                            safeRole(assignedDoctor)
                    )
                            || !"APPROVED".equalsIgnoreCase(
                            safeStatus(assignedDoctor)
                    )
            ) {

                throw new RuntimeException(
                        "The doctor linked with this appointment is no longer approved."
                );
            }

            existingCase.setDoctor(
                    assignedDoctor
            );

        } else {

            /*
             * This is only for old cases created before the
             * appointment module existed.
             *
             * Old rejected cases can continue to use their
             * existing approved doctor.
             *
             * If there is no valid doctor, resubmission is
             * blocked instead of randomly assigning a new doctor.
             */
            if (
                    assignedDoctor == null
                            || !"DOCTOR".equalsIgnoreCase(
                            safeRole(assignedDoctor)
                    )
                            || !"APPROVED".equalsIgnoreCase(
                            safeStatus(assignedDoctor)
                    )
            ) {

                throw new RuntimeException(
                        "This old case has no valid approved doctor. "
                                + "Please create a new appointment before submitting a new case."
                );
            }
        }

        // ========================================================
        // SAVE
        // ========================================================

        Case savedCase =
                caseRepository.save(
                        existingCase
                );

        // ========================================================
        // AUDIT
        // ========================================================

        auditLogService.logAction(
                patientEmail,
                "PATIENT",
                "CASE_RESUBMITTED",
                savedCase.getId(),
                "Patient revised and resubmitted a previously rejected case.",
                "status=SUBMITTED"
                        + ",appointmentLinked="
                        + (savedCase.getAppointment() != null)
        );

        // ========================================================
        // NOTIFY DOCTOR
        // ========================================================

        if (assignedDoctor != null) {

            notifyDoctor(
                    savedCase,
                    assignedDoctor,
                    "Case Resubmitted",
                    "A patient has revised and resubmitted a case assigned to you.",
                    "CASE_RESUBMITTED"
            );
        }

        // ========================================================
        // AI SUMMARY
        // ========================================================

        generateAndSaveAiSummary(
                savedCase
        );

        return savedCase;
    }

    // ============================================================
    // AI SUMMARY
    // ============================================================

    private void generateAndSaveAiSummary(
            Case savedCase
    ) {

        try {

            String aiSummary =
                    aiSummaryService.generateSummary(
                            savedCase
                    );

            savedCase.setAiSummary(
                    aiSummary
            );

            savedCase =
                    caseRepository.save(
                            savedCase
                    );

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

            savedCase =
                    caseRepository.save(
                            savedCase
                    );

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

    // ============================================================
    // PATIENT CASES
    // ============================================================

    public List<Case> getPatientCases(
            String patientEmail
    ) {

        User patient =
                userRepository.findByEmail(
                                patientEmail
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Patient not found"
                                )
                        );

        return caseRepository.findByPatient(
                patient
        );
    }

    // ============================================================
    // DOCTOR CASES
    // ============================================================

    public List<Case> getDoctorCases(
            String doctorEmail
    ) {

        User doctor =
                getApprovedDoctor(
                        doctorEmail
                );

        return caseRepository.findByDoctor(
                doctor
        );
    }

    public List<Case> getDoctorCasesByStatus(
            String doctorEmail,
            String status
    ) {

        User doctor =
                getApprovedDoctor(
                        doctorEmail
                );

        return caseRepository.findByDoctorAndStatus(
                doctor,
                status.toUpperCase()
        );
    }

    // ============================================================
    // ADMIN - ALL CASES
    // ============================================================

    public List<Case> getAllCases() {

        return caseRepository.findAll();
    }

    public List<Case> getCasesByStatus(
            String status
    ) {

        return caseRepository.findByStatus(
                status.toUpperCase()
        );
    }

    // ============================================================
    // GET CASE - PATIENT / DOCTOR / ADMIN SECURITY
    // ============================================================

    public Case getCaseByIdForUser(
            Long id,
            String email,
            String role
    ) {

        Case patientCase =
                getCaseById(id);

        String normalizedRole =
                role != null
                        ? role
                        .replace("ROLE_", "")
                        .toUpperCase()
                        : "";

        // ========================================================
        // ADMIN
        // ========================================================

        if ("ADMIN".equals(normalizedRole)) {

            return patientCase;
        }

        // ========================================================
        // PATIENT
        // ========================================================

        if ("PATIENT".equals(normalizedRole)) {

            if (
                    patientCase.getPatient() == null
                            || patientCase.getPatient().getEmail() == null
                            || !patientCase.getPatient()
                            .getEmail()
                            .equalsIgnoreCase(email)
            ) {

                throw new RuntimeException(
                        "You are not authorized to view this case."
                );
            }

            return patientCase;
        }

        // ========================================================
        // DOCTOR
        // ========================================================

        if ("DOCTOR".equals(normalizedRole)) {

            if (
                    patientCase.getDoctor() == null
                            || patientCase.getDoctor().getEmail() == null
                            || !patientCase.getDoctor()
                            .getEmail()
                            .equalsIgnoreCase(email)
            ) {

                throw new RuntimeException(
                        "This case is not assigned to you."
                );
            }

            return patientCase;
        }

        throw new RuntimeException(
                "You are not authorized to view this case."
        );
    }

    // ============================================================
    // GET CASE BY ID
    // ============================================================

    public Case getCaseById(
            Long id
    ) {

        return caseRepository.findById(
                        id
                )
                .orElseThrow(
                        () -> new RuntimeException(
                                "Case not found"
                        )
                );
    }

    // ============================================================
    // VERIFY CASE
    // ============================================================

    public Case verifyCase(
            Long id,
            String doctorEmail
    ) {

        Case patientCase =
                getCaseForAssignedDoctor(
                        id,
                        doctorEmail
                );

        patientCase.setStatus(
                "REVIEWED"
        );

        patientCase.setReviewedAt(
                LocalDateTime.now()
        );

        patientCase.setRejectionReason(
                null
        );

        Case savedCase =
                caseRepository.save(
                        patientCase
                );

        notifyPatient(
                savedCase,
                "Case Reviewed",
                "Your patient case has been reviewed by the doctor.",
                "CASE_REVIEWED"
        );

        return savedCase;
    }

    // ============================================================
    // REJECT CASE
    // ============================================================

    public Case rejectCase(
            Long id,
            String reason,
            String doctorEmail
    ) {

        Case patientCase =
                getCaseForAssignedDoctor(
                        id,
                        doctorEmail
                );

        String rejectionReason =
                reason != null && !reason.isBlank()
                        ? reason
                        : "Doctor requested revision.";

        patientCase.setStatus(
                "REJECTED"
        );

        patientCase.setRejectionReason(
                rejectionReason
        );

        patientCase.setReviewedAt(
                LocalDateTime.now()
        );

        Case savedCase =
                caseRepository.save(
                        patientCase
                );

        notifyPatient(
                savedCase,
                "Revision Required",
                "Your patient case requires revision. Doctor's reason: "
                        + rejectionReason,
                "CASE_REJECTED"
        );

        return savedCase;
    }

    // ============================================================
    // DOCTOR NOTES
    // ============================================================

    public Case saveDoctorNotes(
            Long id,
            String notes,
            String doctorEmail
    ) {

        Case patientCase =
                getCaseForAssignedDoctor(
                        id,
                        doctorEmail
                );

        patientCase.setDoctorNotes(
                notes != null
                        ? notes
                        : ""
        );

        Case savedCase =
                caseRepository.save(
                        patientCase
                );

        notifyPatient(
                savedCase,
                "Doctor Updated Your Case",
                "The doctor has updated the notes related to your patient case.",
                "DOCTOR_NOTES_UPDATED"
        );

        return savedCase;
    }

    // ============================================================
    // AI VERIFICATION
    // ============================================================

    public Case saveAiVerification(
            Long id,
            boolean verified,
            String verifiedSummary,
            String doctorEmail
    ) {

        Case patientCase =
                getCaseForAssignedDoctor(
                        id,
                        doctorEmail
                );

        // ========================================================
        // VERIFIED
        // ========================================================

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

            patientCase.setDoctorVerifiedSummary(
                    summary
            );

            patientCase.setAiVerified(
                    true
            );

            patientCase.setAiVerifiedAt(
                    LocalDateTime.now()
            );

            patientCase.setAiVerifiedBy(
                    doctorEmail
            );

            Case savedCase =
                    caseRepository.save(
                            patientCase
                    );

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

            // ====================================================
            // UNVERIFIED
            // ====================================================

            patientCase.setDoctorVerifiedSummary(
                    null
            );

            patientCase.setAiVerified(
                    false
            );

            patientCase.setAiVerifiedAt(
                    null
            );

            patientCase.setAiVerifiedBy(
                    null
            );

            Case savedCase =
                    caseRepository.save(
                            patientCase
                    );

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

    // ============================================================
    // DOCTOR AUTHORIZATION
    // ============================================================

    private Case getCaseForAssignedDoctor(
            Long caseId,
            String doctorEmail
    ) {

        User doctor =
                getApprovedDoctor(
                        doctorEmail
                );

        Case patientCase =
                getCaseById(
                        caseId
                );

        if (
                patientCase.getDoctor() == null
                        || patientCase.getDoctor().getId() == null
                        || !patientCase.getDoctor()
                        .getId()
                        .equals(doctor.getId())
        ) {

            throw new RuntimeException(
                    "This case is not assigned to you."
            );
        }

        return patientCase;
    }

    // ============================================================
    // APPROVED DOCTOR
    // ============================================================

    private User getApprovedDoctor(
            String email
    ) {

        User doctor =
                userRepository.findByEmail(
                                email
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Doctor not found"
                                )
                        );

        if (
                !"DOCTOR".equalsIgnoreCase(
                        safeRole(doctor)
                )
        ) {

            throw new RuntimeException(
                    "Authenticated user is not a doctor."
            );
        }

        if (
                !"APPROVED".equalsIgnoreCase(
                        safeStatus(doctor)
                )
        ) {

            throw new RuntimeException(
                    "Doctor account is not approved."
            );
        }

        return doctor;
    }

    // ============================================================
    // DOCTOR NOTIFICATION
    // ============================================================

    private void notifyDoctor(
            Case patientCase,
            User doctor,
            String title,
            String message,
            String type
    ) {

        if (doctor == null) {
            return;
        }

        try {

            notificationService.createNotification(
                    doctor,
                    patientCase,
                    title,
                    message,
                    type
            );

        } catch (Exception e) {

            System.out.println(
                    "DOCTOR NOTIFICATION FAILED for "
                            + doctor.getEmail()
                            + ": "
                            + e.getMessage()
            );
        }
    }

    // ============================================================
    // ADMIN NOTIFICATION
    // ============================================================

    private void notifyAdmins(
            Case patientCase,
            String title,
            String message,
            String type
    ) {

        List<User> users =
                userRepository.findAll();

        for (User user : users) {

            if (
                    !"ADMIN".equalsIgnoreCase(
                            safeRole(user)
                    )
            ) {

                continue;
            }

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
                        "ADMIN NOTIFICATION FAILED for "
                                + user.getEmail()
                                + ": "
                                + e.getMessage()
                );
            }
        }
    }

    // ============================================================
    // PATIENT NOTIFICATION
    // ============================================================

    private void notifyPatient(
            Case patientCase,
            String title,
            String message,
            String type
    ) {

        if (
                patientCase == null
                        || patientCase.getPatient() == null
        ) {

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

    // ============================================================
    // SAFE ROLE
    // ============================================================

    private String safeRole(
            User user
    ) {

        if (
                user == null
                        || user.getRole() == null
        ) {

            return "";
        }

        return user.getRole().trim();
    }

    // ============================================================
    // SAFE STATUS
    // ============================================================

    private String safeStatus(
            User user
    ) {

        if (
                user == null
                        || user.getStatus() == null
        ) {

            return "";
        }

        return user.getStatus().trim();
    }
}