package AYUSH.Case.Taking.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    // =====================================================
    // PRIMARY KEY
    // =====================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =====================================================
    // NOTIFICATION RECIPIENT
    // =====================================================

    /*
     * User who should receive this notification.
     *
     * Example:
     * - Admin receives doctor registration notification
     * - Patient receives case status notification
     * - Doctor receives case assignment notification
     */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "recipient_id",
            nullable = false
    )
    private User recipient;


    // =====================================================
    // RELATED PATIENT CASE
    // =====================================================

    /*
     * Related patient case.
     *
     * This can be NULL for notifications that are not
     * related to a patient case.
     *
     * Example:
     * DOCTOR_REGISTRATION does not belong to a case.
     */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private Case patientCase;


    // =====================================================
    // NOTIFICATION TITLE
    // =====================================================

    /*
     * Short title displayed in the notification panel.
     *
     * Example:
     * "New Doctor Registration"
     */

    @Column(nullable = false)
    private String title;


    // =====================================================
    // NOTIFICATION MESSAGE
    // =====================================================

    /*
     * Full notification message.
     *
     * Example:
     * "A new doctor has registered and is waiting
     *  for admin approval."
     */

    @Column(
            columnDefinition = "TEXT",
            nullable = false
    )
    private String message;


    // =====================================================
    // NOTIFICATION TYPE
    // =====================================================

    /*
     * Notification category/action.
     *
     * Examples:
     *
     * DOCTOR_REGISTRATION
     * DOCTOR_APPROVED
     * DOCTOR_REJECTED
     *
     * CASE_SUBMITTED
     * CASE_REJECTED
     * CASE_RESUBMITTED
     * CASE_REVIEWED
     * DOCTOR_NOTES_UPDATED
     */

    @Column(nullable = false)
    private String type;


    // =====================================================
    // READ / UNREAD STATUS
    // =====================================================

    /*
     * false = unread
     * true  = read
     *
     * New notifications are unread by default.
     */

    @Column(
            name = "is_read",
            nullable = false
    )
    private Boolean isRead = false;


    // =====================================================
    // CREATED AT
    // =====================================================

    /*
     * Time when notification was created.
     *
     * Automatically initialized when a new Notification
     * object is created.
     */

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt = LocalDateTime.now();


    // =====================================================
    // READ AT
    // =====================================================

    /*
     * Time when notification was marked as read.
     *
     * NULL when notification has not been read yet.
     */

    @Column(name = "read_at")
    private LocalDateTime readAt;


    // =====================================================
    // CONVENIENCE CONSTRUCTOR
    // =====================================================

    /*
     * Creates a new unread notification with the current
     * timestamp.
     */

    public Notification(
            User recipient,
            Case patientCase,
            String title,
            String message,
            String type
    ) {

        this.recipient = recipient;
        this.patientCase = patientCase;
        this.title = title;
        this.message = message;
        this.type = type;

        this.isRead = false;
        this.createdAt = LocalDateTime.now();
        this.readAt = null;
    }
}