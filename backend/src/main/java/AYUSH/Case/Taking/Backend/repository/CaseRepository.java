package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseRepository extends JpaRepository<Case, Long> {

    List<Case> findByPatient(User patient);

    List<Case> findByStatus(String status);
}