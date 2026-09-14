package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.dto.AppointmentRequest;
import AYUSH.Case.Taking.Backend.entity.Appointment;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.AppointmentRepository;
import AYUSH.Case.Taking.Backend.repository.DoctorRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            NotificationService notificationService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.notificationService = notificationService;
    }

    // =========================================================
    // BOOK APPOINTMENT
    // =========================================================

    @Transactional
    public Appointment bookAppointment(
            String patientEmail,
            AppointmentRequest request
    ) {

        if (patientEmail == null || patientEmail.isBlank()) {
            throw new RuntimeException("Authenticated patient email is missing");
        }

        if (request == null) {
            throw new RuntimeException("Appointment request is missing");
        }

        String normalizedEmail = normalizeEmail(patientEmail);

        User patient = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Patient account not found for authenticated user"
                        )
                );

        // ---------------------------------------------------------
        // PATIENT VALIDATION
        // ---------------------------------------------------------

        if (!"PATIENT".equalsIgnoreCase(patient.getRole())) {
            throw new RuntimeException(
                    "Only patients can book appointments"
            );
        }

        if (patient.getStatus() != null
                && "BLOCKED".equalsIgnoreCase(patient.getStatus())) {
            throw new RuntimeException(
                    "Your account is blocked and cannot book appointments"
            );
        }

        // ---------------------------------------------------------
        // REQUEST VALIDATION
        // ---------------------------------------------------------

        if (request.doctorId() == null) {
            throw new RuntimeException("Doctor is required");
        }

        if (request.appointmentDate() == null) {
            throw new RuntimeException("Appointment date is required");
        }

        if (request.appointmentTime() == null) {
            throw new RuntimeException("Appointment time is required");
        }

        if (request.reason() == null
                || request.reason().isBlank()) {
            throw new RuntimeException("Appointment reason is required");
        }

        // ---------------------------------------------------------
        // DATE/TIME VALIDATION
        // ---------------------------------------------------------

        LocalDate appointmentDate = request.appointmentDate();

        if (appointmentDate.isBefore(LocalDate.now())) {
            throw new RuntimeException(
                    "Appointment date cannot be in the past"
            );
        }

        LocalDateTime appointmentDateTime =
                appointmentDate.atTime(request.appointmentTime());

        if (appointmentDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Appointment date and time must be in the future"
            );
        }

        // ---------------------------------------------------------
        // DOCTOR VALIDATION
        // ---------------------------------------------------------

        User doctor = userRepository.findById(request.doctorId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Selected doctor not found"
                        )
                );

        if (!"DOCTOR".equalsIgnoreCase(doctor.getRole())) {
            throw new RuntimeException(
                    "Selected user is not a doctor"
            );
        }

        if (!"APPROVED".equalsIgnoreCase(doctor.getStatus())) {
            throw new RuntimeException(
                    "Selected doctor is not approved"
            );
        }

        // Make sure the Doctor profile actually exists.
        doctorRepository.findByUserId(doctor.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Doctor profile not found for selected doctor"
                        )
                );

        // ---------------------------------------------------------
        // SLOT AVAILABILITY
        // ---------------------------------------------------------

        boolean alreadyBooked =
                appointmentRepository
                        .existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatus(
                                doctor,
                                appointmentDate,
                                request.appointmentTime(),
                                "CONFIRMED"
                        );

        if (alreadyBooked) {
            throw new RuntimeException(
                    "This appointment slot is already booked"
            );
        }

        // ---------------------------------------------------------
        // CREATE APPOINTMENT
        // ---------------------------------------------------------

        Appointment appointment = new Appointment();

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(appointmentDate);
        appointment.setAppointmentTime(request.appointmentTime());
        appointment.setStatus("CONFIRMED");
        appointment.setReason(request.reason().trim());
        appointment.setCreatedAt(LocalDateTime.now());

        Appointment saved =
                appointmentRepository.save(appointment);

        // ---------------------------------------------------------
        // NOTIFY DOCTOR
        // ---------------------------------------------------------

        notificationService.createNotification(
                doctor,
                null,
                "New Appointment Booked",
                patient.getName()
                        + " booked an appointment with you for "
                        + saved.getAppointmentDate()
                        + " at "
                        + saved.getAppointmentTime()
                        + ".",
                "APPOINTMENT_BOOKED"
        );

        // ---------------------------------------------------------
        // NOTIFY PATIENT
        // ---------------------------------------------------------

        notificationService.createNotification(
                patient,
                null,
                "Appointment Confirmed",
                "Your appointment with "
                        + doctor.getName()
                        + " is confirmed for "
                        + saved.getAppointmentDate()
                        + " at "
                        + saved.getAppointmentTime()
                        + ".",
                "APPOINTMENT_CONFIRMED"
        );

        return saved;
    }

    // =========================================================
    // GET PATIENT APPOINTMENTS
    // =========================================================

    public List<Appointment> getPatientAppointments(
            String patientEmail
    ) {

        User patient = getUser(patientEmail);

        if (!"PATIENT".equalsIgnoreCase(patient.getRole())) {
            throw new RuntimeException(
                    "Only patients can access patient appointments"
            );
        }

        return appointmentRepository
                .findByPatientOrderByAppointmentDateDescAppointmentTimeDesc(
                        patient
                );
    }

    // =========================================================
    // GET DOCTOR APPOINTMENTS
    // =========================================================

    public List<Appointment> getDoctorAppointments(
            String doctorEmail
    ) {

        User doctor = getUser(doctorEmail);

        if (!"DOCTOR".equalsIgnoreCase(doctor.getRole())) {
            throw new RuntimeException(
                    "Only doctors can access doctor appointments"
            );
        }

        return appointmentRepository
                .findByDoctorOrderByAppointmentDateDescAppointmentTimeDesc(
                        doctor
                );
    }

    // =========================================================
    // CANCEL APPOINTMENT
    // =========================================================

    @Transactional
    public Appointment cancelAppointment(
            Long appointmentId,
            String patientEmail
    ) {

        if (appointmentId == null) {
            throw new RuntimeException(
                    "Appointment ID is required"
            );
        }

        User patient = getUser(patientEmail);

        if (!"PATIENT".equalsIgnoreCase(patient.getRole())) {
            throw new RuntimeException(
                    "Only patients can cancel appointments"
            );
        }

        Appointment appointment =
                appointmentRepository.findById(appointmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Appointment not found"
                                )
                        );

        // ---------------------------------------------------------
        // OWNERSHIP CHECK
        // ---------------------------------------------------------

        if (appointment.getPatient() == null
                || appointment.getPatient().getId() == null
                || !appointment.getPatient()
                        .getId()
                        .equals(patient.getId())) {

            throw new RuntimeException(
                    "You are not authorized to cancel this appointment"
            );
        }

        // ---------------------------------------------------------
        // ALREADY CANCELLED
        // ---------------------------------------------------------

        if ("CANCELLED".equalsIgnoreCase(
                appointment.getStatus()
        )) {
            return appointment;
        }

        // ---------------------------------------------------------
        // CANCEL
        // ---------------------------------------------------------

        appointment.setStatus("CANCELLED");

        Appointment saved =
                appointmentRepository.save(appointment);

        // ---------------------------------------------------------
        // NOTIFY DOCTOR
        // ---------------------------------------------------------

        notificationService.createNotification(
                appointment.getDoctor(),
                null,
                "Appointment Cancelled",
                patient.getName()
                        + " cancelled the appointment scheduled for "
                        + appointment.getAppointmentDate()
                        + " at "
                        + appointment.getAppointmentTime()
                        + ".",
                "APPOINTMENT_CANCELLED"
        );

        return saved;
    }

    // =========================================================
    // GET USER
    // =========================================================

    private User getUser(String email) {

        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isBlank()) {
            throw new RuntimeException(
                    "Authenticated user email is missing"
            );
        }

        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found for authenticated email"
                        )
                );
    }

    // =========================================================
    // EMAIL NORMALIZATION
    // =========================================================

    private String normalizeEmail(String email) {

        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }
}