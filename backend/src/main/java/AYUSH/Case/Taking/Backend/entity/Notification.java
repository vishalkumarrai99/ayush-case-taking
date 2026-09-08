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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * User who should receive this notification.
     */
    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /*
     * Related patient case.
     * Nullable because some future notifications
     * may not belong to a particular case.
     */
    @ManyToOne
    @JoinColumn(name = "case_id")
    private Case patientCase;

    /*
     * Short notification title.
     */
    @Column(nullable = false)
    private String title;

    /*
     * Notification message.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    /*
     * Notification category/action.
     *
     * Examples:
     * CASE_SUBMITTED
     * CASE_REJECTED
     * CASE_RESUBMITTED
     * CASE_REVIEWED
     * DOCTOR_NOTES_UPDATED
     */
    @Column(nullable = false)
    private String type;

    /*
     * Whether the recipient has opened/read it.
     */
    @Column(nullable = false)
    private Boolean isRead = false;

    /*
     * Notification creation time.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /*
     * Time when notification was marked as read.
     */
    private LocalDateTime readAt;
}