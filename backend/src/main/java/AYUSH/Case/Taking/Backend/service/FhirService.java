package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;

import ca.uhn.fhir.context.FhirContext;

import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.CodeableConcept;
import org.hl7.fhir.r4.model.Condition;
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.Patient;
import org.hl7.fhir.r4.model.Observation;
import org.hl7.fhir.r4.model.Practitioner;
import org.hl7.fhir.r4.model.Reference;
import org.hl7.fhir.r4.model.StringType;

import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.util.Date;

@Service
public class FhirService {

    private final CaseRepository caseRepository;

    private final FhirContext fhirContext;

    public FhirService(CaseRepository caseRepository) {
        this.caseRepository = caseRepository;
        this.fhirContext = FhirContext.forR4();
    }

    /**
     * Converts an AYUSH patient case into a FHIR R4 Bundle.
     *
     * Bundle contains:
     * - Patient
     * - Practitioner
     * - Encounter
     * - Condition
     * - AYUSH Assessment Observation
     * - AI Summary Observation
     */
    public String generateFhirBundle(Long caseId) {

        Case patientCase = caseRepository.findById(caseId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Patient case not found: " + caseId
                        )
                );

        Bundle bundle = new Bundle();

        bundle.setType(Bundle.BundleType.COLLECTION);

        // =========================================================
        // FHIR RESOURCE REFERENCES
        // =========================================================

        String patientFullUrl =
                "urn:uuid:patient-" +
                        patientCase.getPatient().getId();

        String encounterFullUrl =
                "urn:uuid:encounter-" +
                        patientCase.getId();

        String practitionerFullUrl =
                "urn:uuid:practitioner-ayush";

        String conditionFullUrl =
                "urn:uuid:condition-" +
                        patientCase.getId();

        String ayushObservationFullUrl =
                "urn:uuid:ayush-observation-" +
                        patientCase.getId();

        String summaryObservationFullUrl =
                "urn:uuid:summary-observation-" +
                        patientCase.getId();


        // =========================================================
        // PATIENT
        // =========================================================

        Patient patient =
                createPatient(
                        patientCase.getPatient()
                );

        Bundle.BundleEntryComponent patientEntry =
                bundle.addEntry();

        patientEntry.setFullUrl(patientFullUrl);
        patientEntry.setResource(patient);


        // =========================================================
        // PRACTITIONER
        // =========================================================

        Practitioner practitioner =
                new Practitioner();

        practitioner.setId(
                "ayush-practitioner"
        );

        practitioner.addName()
                .setText("AYUSH Doctor");

        Bundle.BundleEntryComponent practitionerEntry =
                bundle.addEntry();

        practitionerEntry.setFullUrl(
                practitionerFullUrl
        );

        practitionerEntry.setResource(
                practitioner
        );


        // =========================================================
        // ENCOUNTER
        // =========================================================

        Encounter encounter =
                new Encounter();

        encounter.setId(
                "encounter-" +
                        patientCase.getId()
        );

        encounter.setStatus(
                convertEncounterStatus(
                        patientCase.getStatus()
                )
        );

        encounter.setSubject(
                new Reference(
                        patientFullUrl
                )
        );

        encounter.addParticipant()
                .setIndividual(
                        new Reference(
                                practitionerFullUrl
                        )
                );

        // submittedAt -> FHIR Date
        if (patientCase.getSubmittedAt() != null) {

            Date submittedDate =
                    Date.from(
                            patientCase
                                    .getSubmittedAt()
                                    .atZone(
                                            ZoneOffset.UTC
                                    )
                                    .toInstant()
                    );

            encounter.setPeriod(
                    new org.hl7.fhir.r4.model.Period()
                            .setStart(submittedDate)
            );
        }

        Bundle.BundleEntryComponent encounterEntry =
                bundle.addEntry();

        encounterEntry.setFullUrl(
                encounterFullUrl
        );

        encounterEntry.setResource(
                encounter
        );


        // =========================================================
        // CHIEF COMPLAINT -> CONDITION
        // =========================================================

        if (hasText(
                patientCase.getChiefComplaint()
        )) {

            Condition condition =
                    new Condition();

            condition.setId(
                    "condition-" +
                            patientCase.getId()
            );

            // -----------------------------------------
            // Clinical Status
            // -----------------------------------------

            CodeableConcept clinicalStatus =
                    new CodeableConcept();

            clinicalStatus
                    .addCoding()
                    .setSystem(
                            "http://terminology.hl7.org/CodeSystem/condition-clinical"
                    )
                    .setCode("active")
                    .setDisplay("Active");

            condition.setClinicalStatus(
                    clinicalStatus
            );


            // -----------------------------------------
            // Patient
            // -----------------------------------------

            condition.setSubject(
                    new Reference(
                            patientFullUrl
                    )
            );


            // -----------------------------------------
            // Encounter
            // -----------------------------------------

            condition.setEncounter(
                    new Reference(
                            encounterFullUrl
                    )
            );


            // -----------------------------------------
            // Chief Complaint
            // -----------------------------------------

            CodeableConcept complaint =
                    new CodeableConcept();

            complaint.setText(
                    patientCase.getChiefComplaint()
            );

            condition.setCode(
                    complaint
            );


            Bundle.BundleEntryComponent conditionEntry =
                    bundle.addEntry();

            conditionEntry.setFullUrl(
                    conditionFullUrl
            );

            conditionEntry.setResource(
                    condition
            );
        }


        // =========================================================
        // AYUSH ASSESSMENT -> OBSERVATION
        // =========================================================

        if (hasText(
                patientCase.getAyushAssessment()
        )) {

            Observation observation =
                    new Observation();

            observation.setId(
                    "ayush-observation-" +
                            patientCase.getId()
            );

            observation.setStatus(
                    Observation.ObservationStatus.FINAL
            );

            CodeableConcept assessmentCode =
                    new CodeableConcept();

            assessmentCode.setText(
                    "AYUSH Clinical Assessment"
            );

            observation.setCode(
                    assessmentCode
            );

            observation.setSubject(
                    new Reference(
                            patientFullUrl
                    )
            );

            observation.setEncounter(
                    new Reference(
                            encounterFullUrl
                    )
            );

            observation.setValue(
                    new StringType(
                            patientCase.getAyushAssessment()
                    )
            );

            Bundle.BundleEntryComponent observationEntry =
                    bundle.addEntry();

            observationEntry.setFullUrl(
                    ayushObservationFullUrl
            );

            observationEntry.setResource(
                    observation
            );
        }


        // =========================================================
        // AI SUMMARY -> OBSERVATION
        // =========================================================

        if (hasText(
                patientCase.getAiSummary()
        )) {

            Observation summaryObservation =
                    new Observation();

            summaryObservation.setId(
                    "summary-observation-" +
                            patientCase.getId()
            );

            summaryObservation.setStatus(
                    Observation.ObservationStatus.FINAL
            );

            CodeableConcept summaryCode =
                    new CodeableConcept();

            summaryCode.setText(
                    "AI Generated Clinical Summary"
            );

            summaryObservation.setCode(
                    summaryCode
            );

            summaryObservation.setSubject(
                    new Reference(
                            patientFullUrl
                    )
            );

            summaryObservation.setEncounter(
                    new Reference(
                            encounterFullUrl
                    )
            );

            summaryObservation.setValue(
                    new StringType(
                            patientCase.getAiSummary()
                    )
            );

            Bundle.BundleEntryComponent summaryEntry =
                    bundle.addEntry();

            summaryEntry.setFullUrl(
                    summaryObservationFullUrl
            );

            summaryEntry.setResource(
                    summaryObservation
            );
        }


        // =========================================================
        // SERIALIZE FHIR JSON
        // =========================================================

        return fhirContext
                .newJsonParser()
                .setPrettyPrint(true)
                .encodeResourceToString(
                        bundle
                );
    }


    // =============================================================
    // CREATE FHIR PATIENT
    // =============================================================

    private Patient createPatient(User user) {

        Patient patient =
                new Patient();

        patient.setId(
                "patient-" +
                        user.getId()
        );

        if (hasText(user.getName())) {

            patient.addName()
                    .setText(
                            user.getName()
                    );
        }

        if (hasText(user.getEmail())) {

            patient.addTelecom()
                    .setSystem(
                            org.hl7.fhir.r4.model.ContactPoint.ContactPointSystem.EMAIL
                    )
                    .setValue(
                            user.getEmail()
                    );
        }

        return patient;
    }


    // =============================================================
    // ENCOUNTER STATUS
    // =============================================================

    private Encounter.EncounterStatus
    convertEncounterStatus(String status) {

        if (status == null) {

            return Encounter.EncounterStatus.UNKNOWN;
        }

        return switch (
                status.toUpperCase()
        ) {

            case "SUBMITTED" ->
                    Encounter.EncounterStatus.ARRIVED;

            case "REVIEWED" ->
                    Encounter.EncounterStatus.FINISHED;

            case "REJECTED" ->
                    Encounter.EncounterStatus.CANCELLED;

            default ->
                    Encounter.EncounterStatus.INPROGRESS;
        };
    }


    // =============================================================
    // TEXT CHECK
    // =============================================================

    private boolean hasText(String value) {

        return value != null &&
                !value.trim().isEmpty();
    }
}