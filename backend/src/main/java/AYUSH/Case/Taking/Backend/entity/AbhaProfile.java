package AYUSH.Case.Taking.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "abha_profiles",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_abha_number",
            columnNames = "abhaNumber"
        ),
        @UniqueConstraint(
            name = "uk_abha_address",
            columnNames = "abhaAddress"
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbhaProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * One ABHA profile belongs to one application user.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        unique = true
    )
    private User user;

    /**
     * 14-digit ABHA Number.
     *
     * This field is nullable because a patient may
     * create an application account before linking ABHA.
     */
    @Column(
        length = 14,
        unique = true
    )
    private String abhaNumber;

    /**
     * ABHA Address / username.
     *
     * Example:
     * patient@abdm
     */
    @Column(
        length = 100,
        unique = true
    )
    private String abhaAddress;

    /**
     * Whether this profile has been verified through
     * an actual ABDM/ABHA verification flow.
     *
     * IMPORTANT:
     * Our current prototype does NOT mark a profile as
     * verified merely because a user enters an ABHA number.
     */
    @Column(nullable = false)
    private Boolean verified = false;

    /**
     * Verification source.
     *
     * Example values:
     * - NOT_VERIFIED
     * - ABDM
     * - SANDBOX
     */
    @Column(
        length = 30,
        nullable = false
    )
    private String verificationSource = "NOT_VERIFIED";

    /**
     * Time when verification actually happened.
     */
    private LocalDateTime verifiedAt;

    /**
     * Last time this ABHA profile was updated.
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Record creation time.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {

        LocalDateTime now =
                LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }

        if (verified == null) {
            verified = false;
        }

        if (verificationSource == null ||
                verificationSource.isBlank()) {

            verificationSource =
                    "NOT_VERIFIED";
        }
    }

    @PreUpdate
    protected void onUpdate() {

        updatedAt =
                LocalDateTime.now();
    }
}