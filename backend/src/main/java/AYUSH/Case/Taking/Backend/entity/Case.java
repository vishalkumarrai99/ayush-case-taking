package AYUSH.Case.Taking.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "patient_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ============================================================
    // PATIENT
    // ============================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    // ============================================================
    // DOCTOR
    // ============================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private User doctor;

    // ============================================================
    // APPOINTMENT
    // ============================================================

    /*
     * Every newly submitted case must be linked with
     * the appointment through which the patient started
     * the case-taking process.
     *
     * Old cases are allowed to have this value as null.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    /*
     * This field is used only while receiving the request
     * from the frontend.
     *
     * It is NOT stored as a separate database column.
     */
    @Transient
    private Long appointmentId;

    // ============================================================
    // PATIENT CASE INFORMATION
    // ============================================================

    @Column(columnDefinition = "TEXT")
    private String patientInformation;

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(columnDefinition = "TEXT")
    private String ayushAssessment;

    // ============================================================
    // AI SUMMARY
    // ============================================================

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String doctorVerifiedSummary;

    @Column(nullable = false)
    private Boolean aiVerified = false;

    private LocalDateTime aiVerifiedAt;

    private String aiVerifiedBy;

    // ============================================================
    // DOCTOR NOTES
    // ============================================================

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    // ============================================================
    // CASE STATUS
    // ============================================================

    @Column(nullable = false)
    private String status = "SUBMITTED";

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    // ============================================================
    // TIMESTAMPS
    // ============================================================

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;
}