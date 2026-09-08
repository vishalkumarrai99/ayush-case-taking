package AYUSH.Case.Taking.Backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Patient associated with this activity.
     * Hidden from JSON response to avoid exposing
     * unnecessary patient/user object data.
     */
    @ManyToOne
    @JoinColumn(name = "patient_id")
    @JsonIgnore
    private User patient;

    /*
     * Case associated with this activity.
     * Hidden from JSON response to prevent recursive
     * Case -> User -> Case style serialization.
     */
    @ManyToOne
    @JoinColumn(name = "case_id")
    @JsonIgnore
    private Case patientCase;

    /*
     * Email of the person/system that performed the action.
     *
     * Examples:
     * patient2@test.com
     * doctor@test.com
     * system
     */
    @Column(nullable = false)
    private String actorEmail;

    /*
     * Role of the actor.
     *
     * Examples:
     * PATIENT
     * DOCTOR
     * ADMIN
     * SYSTEM
     */
    @Column(nullable = false)
    private String actorRole;

    /*
     * Machine-readable audit action.
     *
     * Examples:
     * CASE_SUBMITTED
     * CASE_OPENED
     * DOCUMENT_UPLOADED
     * DOCTOR_NOTES_SAVED
     * CASE_VERIFIED
     * CASE_REJECTED
     * AI_SUMMARY_GENERATED
     * AI_SUMMARY_VERIFIED
     */
    @Column(nullable = false)
    private String action;

    /*
     * Human-readable description of the activity.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /*
     * Optional structured metadata.
     *
     * We will store only useful audit information here,
     * not the complete medical case or sensitive payload.
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    /*
     * Exact date and time when the activity happened.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;
}