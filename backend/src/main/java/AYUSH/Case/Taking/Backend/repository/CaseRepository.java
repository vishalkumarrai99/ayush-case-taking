package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseRepository extends JpaRepository<Case, Long> {

    // ============================================================
    // PATIENT CASES
    // ============================================================

    List<Case> findByPatient(User patient);

    // ============================================================
    // STATUS
    // ============================================================

    List<Case> findByStatus(String status);

    // ============================================================
    // DOCTOR CASES
    // ============================================================

    List<Case> findByDoctor(User doctor);

    List<Case> findByDoctorAndStatus(
            User doctor,
            String status
    );

    // ============================================================
    // APPOINTMENT
    // ============================================================

    /*
     * Case has a relationship:
     *
     * Case -> appointment -> id
     *
     * Therefore Spring Data JPA must navigate through
     * the appointment entity and then its id.
     */
    boolean existsByAppointment_Id(Long appointmentId);
}