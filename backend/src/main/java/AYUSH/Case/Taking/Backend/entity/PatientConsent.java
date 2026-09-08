package AYUSH.Case.Taking.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "patient_consents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case patientCase;

    @Column(nullable = false)
    private String consentVersion;

    @Column(nullable = false)
    private Boolean consentGiven = false;

    @Column(columnDefinition = "TEXT")
    private String consentScope;

    @Column(nullable = false)
    private LocalDateTime consentAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}