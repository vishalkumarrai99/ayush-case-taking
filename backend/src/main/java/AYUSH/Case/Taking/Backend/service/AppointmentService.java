package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.dto.AppointmentRequest;
import AYUSH.Case.Taking.Backend.entity.Appointment;
import AYUSH.Case.Taking.Backend.entity.Doctor;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.AppointmentRepository;
import AYUSH.Case.Taking.Backend.repository.DoctorRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public Appointment bookAppointment(
            String patientEmail,
            AppointmentRequest request
    ) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() ->
                        new RuntimeException("Patient not found")
                );

        if (!"PATIENT".equalsIgnoreCase(patient.getRole())) {
            throw new RuntimeException(
                    "Only patients can book appointments"
            );
        }

        User doctor = userRepository.findById(request.doctorId())
                .orElseThrow(() ->
                        new RuntimeException("Doctor not found")
                );

        if (!"DOCTOR".equalsIgnoreCase(doctor.getRole())
                || !"APPROVED".equalsIgnoreCase(doctor.getStatus())) {

            throw new RuntimeException(
                    "Selected doctor is not approved"
            );
        }

        // Verify that a Doctor profile exists for this user.
        doctorRepository.findByUserId(doctor.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Doctor profile not found"
                        )
                );

        LocalDateTime appointmentDateTime =
                request.appointmentDate()
                        .atTime(request.appointmentTime());

        if (appointmentDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Appointment date and time must be in the future"
            );
        }

        boolean alreadyBooked =
                appointmentRepository
                        .existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatus(
                                doctor,
                                request.appointmentDate(),
                                request.appointmentTime(),
                                "CONFIRMED"
                        );

        if (alreadyBooked) {
            throw new RuntimeException(
                    "This appointment slot is already booked"
            );
        }

        Appointment appointment = new Appointment();

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(
                request.appointmentDate()
        );
        appointment.setAppointmentTime(
                request.appointmentTime()
        );
        appointment.setStatus("CONFIRMED");
        appointment.setReason(
                request.reason().trim()
        );
        appointment.setCreatedAt(
                LocalDateTime.now()
        );

        Appointment saved =
                appointmentRepository.save(appointment);

        // Notify doctor.
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

        // Notify patient.
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

    public List<Appointment> getPatientAppointments(
            String patientEmail
    ) {

        User patient = getUser(patientEmail);

        return appointmentRepository
                .findByPatientOrderByAppointmentDateDescAppointmentTimeDesc(
                        patient
                );
    }

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

    @Transactional
    public Appointment cancelAppointment(
            Long appointmentId,
            String patientEmail
    ) {

        User patient = getUser(patientEmail);

        Appointment appointment =
                appointmentRepository.findById(appointmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Appointment not found"
                                )
                        );

        if (!appointment.getPatient()
                .getId()
                .equals(patient.getId())) {

            throw new RuntimeException(
                    "You are not authorized to cancel this appointment"
            );
        }

        if ("CANCELLED".equalsIgnoreCase(
                appointment.getStatus()
        )) {
            return appointment;
        }

        appointment.setStatus("CANCELLED");

        Appointment saved =
                appointmentRepository.save(appointment);

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

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );
    }
}