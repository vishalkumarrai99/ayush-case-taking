package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.Notification;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.NotificationRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /*
     * Create a notification for a specific user.
     */
    public Notification createNotification(
            User recipient,
            Case patientCase,
            String title,
            String message,
            String type) {

        Notification notification = new Notification();

        notification.setRecipient(recipient);
        notification.setPatientCase(patientCase);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setReadAt(null);

        return notificationRepository.save(notification);
    }

    /*
     * Create a notification using recipient email.
     */
    public Notification createNotification(
            String recipientEmail,
            Case patientCase,
            String title,
            String message,
            String type) {

        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException("Notification recipient not found")
                );

        return createNotification(
                recipient,
                patientCase,
                title,
                message,
                type
        );
    }

    /*
     * Get all notifications for the logged-in user.
     */
    public List<Notification> getMyNotifications(
            String recipientEmail) {

        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc(recipient);
    }

    /*
     * Get unread notifications for the logged-in user.
     */
    public List<Notification> getMyUnreadNotifications(
            String recipientEmail) {

        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return notificationRepository
                .findByRecipientAndIsReadFalseOrderByCreatedAtDesc(
                        recipient
                );
    }

    /*
     * Get unread notification count.
     */
    public long getUnreadCount(
            String recipientEmail) {

        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return notificationRepository
                .countByRecipientAndIsReadFalse(recipient);
    }

    /*
     * Mark one notification as read.
     *
     * Security:
     * A user can only mark their own notification as read.
     */
    public Notification markAsRead(
            Long notificationId,
            String recipientEmail) {

        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() ->
                        new RuntimeException("Notification not found")
                );

        if (notification.getRecipient() == null
                || !notification.getRecipient().getEmail()
                    .equalsIgnoreCase(recipientEmail)) {

            throw new RuntimeException(
                    "You are not authorized to update this notification."
            );
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    /*
     * Mark all notifications as read for the logged-in user.
     */
    public void markAllAsRead(
            String recipientEmail) {

        User recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        List<Notification> notifications =
                notificationRepository
                        .findByRecipientOrderByCreatedAtDesc(recipient);

        LocalDateTime now = LocalDateTime.now();

        for (Notification notification : notifications) {

            if (!Boolean.TRUE.equals(notification.getIsRead())) {

                notification.setIsRead(true);
                notification.setReadAt(now);
            }
        }

        notificationRepository.saveAll(notifications);
    }
}