package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.Notification;
import AYUSH.Case.Taking.Backend.service.NotificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    /*
     * Get all notifications for the logged-in user.
     */
    @GetMapping("/my")
    public ResponseEntity<List<Notification>> getMyNotifications(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                notificationService.getMyNotifications(email)
        );
    }

    /*
     * Get only unread notifications.
     */
    @GetMapping("/my/unread")
    public ResponseEntity<List<Notification>> getMyUnreadNotifications(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                notificationService.getMyUnreadNotifications(email)
        );
    }

    /*
     * Get unread notification count.
     */
    @GetMapping("/my/unread/count")
    public ResponseEntity<Long> getUnreadCount(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                notificationService.getUnreadCount(email)
        );
    }

    /*
     * Mark one notification as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                notificationService.markAsRead(
                        id,
                        email
                )
        );
    }

    /*
     * Mark all notifications as read.
     */
    @PutMapping("/my/read-all")
    public ResponseEntity<Void> markAllAsRead(
            Authentication authentication) {

        String email = authentication.getName();

        notificationService.markAllAsRead(email);

        return ResponseEntity.ok().build();
    }
}