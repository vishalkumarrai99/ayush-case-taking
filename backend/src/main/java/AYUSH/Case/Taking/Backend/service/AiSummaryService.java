package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Case;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiSummaryService {

    private final ChatClient chatClient;

    public AiSummaryService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * Generates an AI-assisted clinical documentation summary.
     *
     * IMPORTANT:
     * This service does NOT diagnose, prescribe, or recommend treatment.
     * It only organizes the information already provided in the case.
     */
    public String generateSummary(Case patientCase) {

        if (patientCase == null) {
            return "AI summary could not be generated because the patient case is missing.";
        }

        String prompt = """
                You are an AI clinical documentation assistant
                inside an AYUSH patient case-taking system.

                Your ONLY responsibility is to organize, summarize,
                and highlight information that is already present
                in the patient case.

                You are NOT a doctor and must NOT make an autonomous
                clinical decision.

                ================================
                STRICT SAFETY RULES
                ================================

                1. DO NOT diagnose any disease or medical condition.

                2. DO NOT prescribe medicines.

                3. DO NOT recommend treatment.

                4. DO NOT recommend dosage, therapy, procedures,
                   or clinical interventions.

                5. DO NOT invent patient information.

                6. DO NOT assume information that is not explicitly
                   present in the case.

                7. If information is missing, write:
                   "Not provided."

                8. If information is unclear, write:
                   "Needs clarification."

                9. Preserve the patient's reported information
                   as faithfully as possible.

                10. Highlight symptoms, statements, findings,
                    or other information that may require
                    doctor attention.

                11. A highlighted item is NOT a diagnosis.
                    Use neutral language such as:
                    "Doctor attention may be required."

                12. Do not convert a symptom into a disease diagnosis.

                13. Do not create medical conclusions from incomplete data.

                14. The final clinical decision must always be made
                    by a qualified healthcare professional.

                15. Clearly label this output as:
                    "AI-Assisted Clinical Documentation Summary"

                ================================
                AYUSH INFORMATION
                ================================

                Preserve and organize the following AYUSH assessment
                information when it is present:

                - Prakriti
                - Vikriti
                - Agni
                - Koshtha
                - Ahara
                - Vihara
                - Nidana
                - Samprapti
                - Dashavidha Pariksha

                Do NOT independently calculate or diagnose Prakriti
                or Vikriti.

                If a Prakriti result is already present in the patient
                information, report it as patient/system-provided
                information rather than presenting it as a diagnosis.

                ================================
                OUTPUT FORMAT
                ================================

                Produce a concise physician-readable summary using
                exactly these sections:

                # AI-Assisted Clinical Documentation Summary

                ## 1. Patient Overview

                Summarize only the patient information available.

                ## 2. Chief Complaint & Symptoms

                List the patient's reported complaints and symptoms.

                ## 3. Medical History

                Summarize the available medical history.

                ## 4. AYUSH Assessment

                Organize available information under:

                - Prakriti
                - Vikriti
                - Agni
                - Koshtha
                - Ahara
                - Vihara
                - Nidana
                - Samprapti
                - Dashavidha Pariksha

                If a subsection is unavailable, write:
                "Not provided."

                ## 5. Important Clinical Observations

                Mention important information explicitly present
                in the case that may help the doctor understand
                the patient's presentation.

                Do not make a diagnosis.

                ## 6. Red Flags / Points Requiring Doctor Attention

                Mention only concerning symptoms, statements,
                findings, or inconsistencies that are actually
                present in the supplied information.

                Do not invent red flags.

                If no concerning information is explicitly present,
                write:

                "No specific red-flag information was identified
                in the supplied case data. Doctor review is still required."

                ## 7. Information Missing / Needs Clarification

                Mention important information that is absent,
                incomplete, ambiguous, or requires clarification.

                ## 8. Doctor Review Notice

                Write:

                "This AI-generated summary is for clinical
                documentation and decision-support purposes only.
                It is not a diagnosis or treatment recommendation.
                The final clinical assessment and decision must be
                made by a qualified healthcare professional."

                ================================
                PATIENT CASE DATA
                ================================

                Patient Information:
                %s

                Chief Complaint & Symptoms:
                %s

                Medical History:
                %s

                AYUSH Assessment:
                %s

                ================================
                FINAL INSTRUCTION
                ================================

                Use ONLY the information supplied above.

                Do not add facts from general medical knowledge.

                Do not diagnose.

                Do not prescribe.

                Do not recommend treatment.

                Do not fabricate missing information.

                Keep the final response concise, structured,
                professional, and useful for physician review.
                """.formatted(
                safeValue(patientCase.getPatientInformation()),
                safeValue(patientCase.getChiefComplaint()),
                safeValue(patientCase.getMedicalHistory()),
                safeValue(patientCase.getAyushAssessment())
        );

        try {

            System.out.println("======================================");
            System.out.println("AI CLINICAL SUMMARY GENERATION STARTED");
            System.out.println("Case ID: " + patientCase.getId());
            System.out.println("======================================");

            String response = chatClient
                    .prompt()
                    .user(prompt)
                    .call()
                    .content();

            if (response == null || response.isBlank()) {

                System.out.println("======================================");
                System.out.println("GEMINI RETURNED EMPTY RESPONSE");
                System.out.println("======================================");

                return "AI summary could not be generated.";
            }

            System.out.println("======================================");
            System.out.println("AI CLINICAL SUMMARY GENERATED");
            System.out.println("Case ID: " + patientCase.getId());
            System.out.println("======================================");

            return response.trim();

        } catch (Exception e) {

            System.out.println("======================================");
            System.out.println("GEMINI AI SUMMARY ERROR");
            System.out.println("Exception Type: "
                    + e.getClass().getName());

            System.out.println("Error Message: "
                    + e.getMessage());

            System.out.println("Cause: "
                    + (e.getCause() != null
                    ? e.getCause().toString()
                    : "No cause"));

            System.out.println("======================================");

            e.printStackTrace();

            return "AI summary could not be generated at this time. "
                    + "Please review the patient's structured case information manually.";
        }
    }

    /**
     * Prevents null or blank values from reaching the AI prompt.
     */
    private String safeValue(String value) {

        if (value == null || value.isBlank()) {
            return "Not provided.";
        }

        return value.trim();
    }
}