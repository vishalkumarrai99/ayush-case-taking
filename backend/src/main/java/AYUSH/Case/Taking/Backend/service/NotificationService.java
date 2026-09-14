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
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }


    // =====================================================
    // CREATE NOTIFICATION FOR USER
    // =====================================================

    public Notification createNotification(
            User recipient,
            Case patientCase,
            String title,
            String message,
            String type
    ) {

        Notification notification = new Notification();

        notification.setRecipient(recipient);

        // Can be null for notifications that are
        // not related to a patient case.
        notification.setPatientCase(patientCase);

        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);

        notification.setIsRead(false);

        notification.setCreatedAt(
                LocalDateTime.now()
        );

        notification.setReadAt(null);

        return notificationRepository.save(notification);
    }


    // =====================================================
    // CREATE NOTIFICATION USING EMAIL
    // =====================================================

    public Notification createNotification(
            String recipientEmail,
            Case patientCase,
            String title,
            String message,
            String type
    ) {

        User recipient = userRepository
                .findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification recipient not found"
                        )
                );

        return createNotification(
                recipient,
                patientCase,
                title,
                message,
                type
        );
    }


    // =====================================================
    // GET ALL NOTIFICATIONS
    // =====================================================

    public List<Notification> getMyNotifications(
            String recipientEmail
    ) {

        User recipient = userRepository
                .findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc(
                        recipient
                );
    }


    // =====================================================
    // GET UNREAD NOTIFICATIONS
    // =====================================================

    public List<Notification> getMyUnreadNotifications(
            String recipientEmail
    ) {

        User recipient = userRepository
                .findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        return notificationRepository
                .findByRecipientAndIsReadFalseOrderByCreatedAtDesc(
                        recipient
                );
    }


    // =====================================================
    // GET UNREAD COUNT
    // =====================================================

    public long getUnreadCount(
            String recipientEmail
    ) {

        User recipient = userRepository
                .findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        return notificationRepository
                .countByRecipientAndIsReadFalse(
                        recipient
                );
    }


    // =====================================================
    // MARK ONE AS READ
    // =====================================================

    public Notification markAsRead(
            Long notificationId,
            String recipientEmail
    ) {

        Notification notification =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );


        // -------------------------------------------------
        // Security check
        // -------------------------------------------------

        if (notification.getRecipient() == null
                || !notification.getRecipient()
                        .getEmail()
                        .equalsIgnoreCase(
                                recipientEmail
                        )) {

            throw new RuntimeException(
                    "You are not authorized to update this notification."
            );
        }


        notification.setIsRead(true);

        notification.setReadAt(
                LocalDateTime.now()
        );

        return notificationRepository.save(
                notification
        );
    }


    // =====================================================
    // MARK ALL AS READ
    // =====================================================

    public void markAllAsRead(
            String recipientEmail
    ) {

        User recipient = userRepository
                .findByEmail(recipientEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );


        List<Notification> notifications =
                notificationRepository
                        .findByRecipientOrderByCreatedAtDesc(
                                recipient
                        );


        LocalDateTime now =
                LocalDateTime.now();


        for (Notification notification : notifications) {

            if (!Boolean.TRUE.equals(
                    notification.getIsRead()
            )) {

                notification.setIsRead(true);

                notification.setReadAt(now);
            }
        }


        notificationRepository.saveAll(
                notifications
        );
    }
}