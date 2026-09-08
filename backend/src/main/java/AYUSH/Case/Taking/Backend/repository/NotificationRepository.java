package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.Notification;
import AYUSH.Case.Taking.Backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    /*
     * Get all notifications for a particular user.
     * Newest notifications appear first.
     */
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    /*
     * Get unread notifications for a user.
     */
    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(
            User recipient
    );

    /*
     * Count unread notifications.
     */
    long countByRecipientAndIsReadFalse(User recipient);
}