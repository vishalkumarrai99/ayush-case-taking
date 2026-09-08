package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.AuditLog;
import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.AuditLogRepository;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CaseRepository caseRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            CaseRepository caseRepository) {

        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
    }

    /*
     * Main method used to create an audit record.
     */
    public AuditLog logAction(
            String actorEmail,
            String actorRole,
            String action,
            Long caseId,
            String description,
            String metadata) {

        AuditLog auditLog = new AuditLog();

        auditLog.setActorEmail(
                actorEmail != null && !actorEmail.isBlank()
                        ? actorEmail
                        : "system"
        );

        auditLog.setActorRole(
                actorRole != null && !actorRole.isBlank()
                        ? actorRole
                        : "SYSTEM"
        );

        auditLog.setAction(action);
        auditLog.setDescription(description);
        auditLog.setMetadata(metadata);
        auditLog.setCreatedAt(LocalDateTime.now());

        /*
         * Attach case and patient when a case ID is available.
         */
        if (caseId != null) {

            Case patientCase = caseRepository.findById(caseId)
                    .orElse(null);

            if (patientCase != null) {
                auditLog.setPatientCase(patientCase);
                auditLog.setPatient(patientCase.getPatient());
            }
        }

        /*
         * If there is no case but the actor is a patient,
         * attach the patient directly.
         */
        if (auditLog.getPatient() == null
                && actorEmail != null
                && !actorEmail.isBlank()) {

            User actor = userRepository.findByEmail(actorEmail)
                    .orElse(null);

            if (actor != null
                    && "PATIENT".equalsIgnoreCase(actor.getRole())) {

                auditLog.setPatient(actor);
            }
        }

        return auditLogRepository.save(auditLog);
    }

    /*
     * Get all audit activities related to a particular case.
     */
    public List<AuditLog> getCaseAuditHistory(Long caseId) {

        Case patientCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        return auditLogRepository
                .findByPatientCaseOrderByCreatedAtDesc(patientCase);
    }

    /*
     * Get all audit activities related to a particular patient.
     */
    public List<AuditLog> getPatientAuditHistory(String patientEmail) {

        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return auditLogRepository
                .findByPatientOrderByCreatedAtDesc(patient);
    }

    /*
     * Get activities performed by a particular actor.
     */
    public List<AuditLog> getActorAuditHistory(String actorEmail) {

        return auditLogRepository
                .findByActorEmailOrderByCreatedAtDesc(actorEmail);
    }
}