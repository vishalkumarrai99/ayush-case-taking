package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.dto.AppointmentRequest;
import AYUSH.Case.Taking.Backend.entity.Appointment;
import AYUSH.Case.Taking.Backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(
            AppointmentService appointmentService
    ) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<Appointment> bookAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        Appointment appointment =
                appointmentService.bookAppointment(
                        email,
                        request
                );

        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Appointment>> getMyAppointments(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                appointmentService.getPatientAppointments(email)
        );
    }

    @GetMapping("/doctor/my")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                appointmentService.getDoctorAppointments(email)
        );
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(
            @PathVariable Long id,
            Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                appointmentService.cancelAppointment(
                        id,
                        email
                )
        );
    }
}