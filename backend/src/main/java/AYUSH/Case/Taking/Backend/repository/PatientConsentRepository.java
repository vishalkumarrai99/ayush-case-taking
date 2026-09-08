package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.PatientConsent;
import AYUSH.Case.Taking.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientConsentRepository extends JpaRepository<PatientConsent, Long> {

    List<PatientConsent> findByPatient(User patient);

    Optional<PatientConsent> findTopByPatientOrderByConsentAtDesc(User patient);
}