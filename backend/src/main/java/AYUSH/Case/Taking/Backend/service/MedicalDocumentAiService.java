package AYUSH.Case.Taking.Backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MedicalDocumentAiService {

    private final ChatClient chatClient;

    public MedicalDocumentAiService(
            ChatClient.Builder chatClientBuilder
    ) {
        this.chatClient = chatClientBuilder.build();
    }

    public String analyzeDocument(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Medical document is empty");
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                (
                        !contentType.equals("application/pdf") &&
                        !contentType.equals("image/jpeg") &&
                        !contentType.equals("image/png") &&
                        !contentType.equals("image/webp")
                )
        ) {
            throw new RuntimeException(
                    "Unsupported document type. " +
                    "Please upload PDF, JPG, PNG or WEBP."
            );
        }

        try {

            System.out.println("======================================");
            System.out.println("MEDICAL DOCUMENT AI ANALYSIS STARTED");
            System.out.println("File: " + file.getOriginalFilename());
            System.out.println("Type: " + contentType);
            System.out.println("Size: " + file.getSize() + " bytes");
            System.out.println("======================================");

            byte[] fileBytes = file.getBytes();

            ByteArrayResource resource =
                    new ByteArrayResource(fileBytes) {

                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    };

            MimeType mimeType =
                    MimeType.valueOf(contentType);

            Media media =
                    new Media(
                            mimeType,
                            resource
                    );

            String prompt = """
                    You are a medical document extraction
                    assistant for an AYUSH clinical case-taking
                    system.

                    Analyze the attached medical document.

                    Your job is ONLY to extract and organize
                    information that is visibly present in the
                    document.

                    IMPORTANT RULES:

                    1. Do NOT diagnose the patient.
                    2. Do NOT prescribe medicines.
                    3. Do NOT recommend treatment.
                    4. Do NOT invent information.
                    5. If something cannot be read, say
                       "Not clearly readable".
                    6. Preserve exact medical values whenever
                       possible.
                    7. Clearly identify abnormal or important
                       values, but do not provide a diagnosis.
                    8. The doctor must verify all extracted
                       information.

                    Return the result using these sections:

                    DOCUMENT TYPE

                    PATIENT INFORMATION

                    TEST / REPORT INFORMATION

                    IMPORTANT VALUES

                    ABNORMAL OR IMPORTANT FINDINGS

                    MEDICINES MENTIONED

                    DOCTOR / HOSPITAL INFORMATION

                    INFORMATION NOT CLEARLY READABLE

                    For laboratory reports, preserve:

                    - Test name
                    - Result
                    - Unit
                    - Reference range

                    For prescriptions, preserve:

                    - Medicine name
                    - Strength
                    - Dosage/frequency if visible
                    - Duration if visible

                    This is document extraction and clinical
                    documentation assistance only.

                    It is NOT a diagnosis.
                    """;

            System.out.println("Sending document to Gemini...");

            String result = chatClient
                    .prompt()
                    .user(user -> user
                            .text(prompt)
                            .media(media)
                    )
                    .call()
                    .content();

            System.out.println("======================================");
            System.out.println("MEDICAL DOCUMENT AI ANALYSIS COMPLETED");
            System.out.println("======================================");

            if (result == null || result.isBlank()) {
                throw new RuntimeException(
                        "Gemini returned an empty response."
                );
            }

            return result;

        } catch (Exception e) {

            System.out.println("======================================");
            System.out.println("MEDICAL DOCUMENT AI ANALYSIS FAILED");
            System.out.println(
                    "Error: " + e.getMessage()
            );
            System.out.println("======================================");

            throw new RuntimeException(
                    "Could not analyze medical document.",
                    e
            );
        }
    }
}