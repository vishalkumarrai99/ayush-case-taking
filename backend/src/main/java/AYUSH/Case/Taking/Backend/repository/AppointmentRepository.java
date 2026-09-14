package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.Appointment;
import AYUSH.Case.Taking.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientOrderByAppointmentDateDescAppointmentTimeDesc(
            User patient
    );

    List<Appointment> findByDoctorOrderByAppointmentDateDescAppointmentTimeDesc(
            User doctor
    );

    boolean existsByDoctorAndAppointmentDateAndAppointmentTimeAndStatus(
            User doctor,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            String status
    );
}