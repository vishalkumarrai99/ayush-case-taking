package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.MedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalDocumentRepository
        extends JpaRepository<MedicalDocument, Long> {

    List<MedicalDocument> findByPatientCase(Case patientCase);
}