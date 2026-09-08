package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.AuditLog;
import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Get complete audit history of a particular case
    List<AuditLog> findByPatientCaseOrderByCreatedAtDesc(Case patientCase);

    // Get complete audit history of a particular patient
    List<AuditLog> findByPatientOrderByCreatedAtDesc(User patient);

    // Get audit history performed by a particular user
    List<AuditLog> findByActorEmailOrderByCreatedAtDesc(String actorEmail);
}