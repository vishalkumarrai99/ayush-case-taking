package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.entity.MedicalDocument;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;
import AYUSH.Case.Taking.Backend.repository.MedicalDocumentRepository;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class MedicalDocumentService {

    private final MedicalDocumentRepository medicalDocumentRepository;
    private final CaseRepository caseRepository;
    private final MedicalDocumentAiService medicalDocumentAiService;
    private final AuditLogService auditLogService;

    private final Path uploadDirectory =
            Paths.get("uploads/medical-documents");

    public MedicalDocumentService(
            MedicalDocumentRepository medicalDocumentRepository,
            CaseRepository caseRepository,
            MedicalDocumentAiService medicalDocumentAiService,
            AuditLogService auditLogService
    ) {
        this.medicalDocumentRepository = medicalDocumentRepository;
        this.caseRepository = caseRepository;
        this.medicalDocumentAiService = medicalDocumentAiService;
        this.auditLogService = auditLogService;
    }

    /*
     * Upload a medical document.
     *
     * The patient must own the case.
     *
     * IMPORTANT:
     * AI analysis is intentionally started in the background.
     * The upload request does not wait for Gemini.
     */
    public MedicalDocument uploadDocument(
            Long caseId,
            MultipartFile file,
            Authentication authentication
    ) throws IOException {

        System.out.println("======================================");
        System.out.println("MEDICAL DOCUMENT UPLOAD STARTED");
        System.out.println("Case ID: " + caseId);
        System.out.println("User: " + authentication.getName());
        System.out.println("======================================");

        Case patientCase = getCase(caseId);

        ensureCanUpload(
                patientCase,
                authentication
        );

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String originalFileName =
                file.getOriginalFilename();

        if (originalFileName == null
                || originalFileName.isBlank()) {

            throw new RuntimeException(
                    "Invalid file name"
            );
        }

        Files.createDirectories(uploadDirectory);

        String safeOriginalFileName =
                Paths.get(originalFileName)
                        .getFileName()
                        .toString();

        String storedFileName =
                System.currentTimeMillis()
                        + "_"
                        + safeOriginalFileName;

        Path targetPath =
                uploadDirectory.resolve(storedFileName);

        /*
         * Save physical file.
         */
        Files.copy(
                file.getInputStream(),
                targetPath
        );

        System.out.println(
                "Physical file saved: "
                        + targetPath
        );

        /*
         * Create database record.
         */
        MedicalDocument document =
                new MedicalDocument();

        document.setPatientCase(patientCase);
        document.setFileName(safeOriginalFileName);
        document.setFileType(file.getContentType());
        document.setFilePath(targetPath.toString());
        document.setUploadedAt(LocalDateTime.now());

        /*
         * AI is not completed yet.
         */
        document.setExtractedText(
                "AI document extraction in progress."
        );

        document.setAiSummary(
                "AI document analysis in progress."
        );

        MedicalDocument savedDocument =
                medicalDocumentRepository.save(document);

        System.out.println(
                "Medical document saved with ID: "
                        + savedDocument.getId()
        );

        /*
         * Audit upload.
         */
        auditLogService.logAction(
                authentication.getName(),
                "PATIENT",
                "DOCUMENT_UPLOADED",
                caseId,
                "Patient uploaded a medical document.",
                "fileName="
                        + safeOriginalFileName
                        + ";fileType="
                        + (
                        file.getContentType() != null
                                ? file.getContentType()
                                : "unknown"
                )
        );

        /*
         * IMPORTANT:
         *
         * Create a separate byte[] before starting the
         * background task.
         *
         * MultipartFile should NOT be depended upon after
         * the HTTP request finishes.
         */
        byte[] fileBytes = file.getBytes();

        String fileName = safeOriginalFileName;
        String fileType = file.getContentType();

        Long documentId = savedDocument.getId();

        /*
         * Start AI analysis in background.
         *
         * The patient upload request will NOT wait for Gemini.
         */
        CompletableFuture.runAsync(() -> {

            System.out.println("======================================");
            System.out.println("BACKGROUND AI ANALYSIS STARTED");
            System.out.println("Document ID: " + documentId);
            System.out.println("File: " + fileName);
            System.out.println("======================================");

            try {

                MultipartFile backgroundFile =
                        new ByteArrayMultipartFile(
                                fileBytes,
                                fileName,
                                fileType
                        );

                String aiResult =
                        medicalDocumentAiService
                                .analyzeDocument(
                                        backgroundFile
                                );

                MedicalDocument documentForUpdate =
                        medicalDocumentRepository
                                .findById(documentId)
                                .orElse(null);

                if (documentForUpdate == null) {

                    System.out.println(
                            "AI UPDATE FAILED: Document not found. ID="
                                    + documentId
                    );

                    return;
                }

                documentForUpdate.setExtractedText(
                        aiResult
                );

                documentForUpdate.setAiSummary(
                        aiResult
                );

                MedicalDocument updatedDocument =
                        medicalDocumentRepository.save(
                                documentForUpdate
                        );

                auditLogService.logAction(
                        "system",
                        "SYSTEM",
                        "DOCUMENT_AI_ANALYSIS_COMPLETED",
                        caseId,
                        "AI-assisted medical document analysis was completed.",
                        "documentId="
                                + updatedDocument.getId()
                );

                System.out.println("======================================");
                System.out.println("BACKGROUND AI ANALYSIS COMPLETED");
                System.out.println("Document ID: " + documentId);
                System.out.println("======================================");

            } catch (Exception e) {

                System.out.println("======================================");
                System.out.println("BACKGROUND AI ANALYSIS FAILED");
                System.out.println("Document ID: " + documentId);
                System.out.println(
                        "Error: " + e.getMessage()
                );
                System.out.println("======================================");

                try {

                    MedicalDocument failedDocument =
                            medicalDocumentRepository
                                    .findById(documentId)
                                    .orElse(null);

                    if (failedDocument != null) {

                        failedDocument.setExtractedText(
                                "AI extraction could not be completed. "
                                        + "Please review the uploaded document manually."
                        );

                        failedDocument.setAiSummary(
                                "AI analysis could not be completed at this time."
                        );

                        medicalDocumentRepository.save(
                                failedDocument
                        );
                    }

                    auditLogService.logAction(
                            "system",
                            "SYSTEM",
                            "DOCUMENT_AI_ANALYSIS_FAILED",
                            caseId,
                            "AI-assisted medical document analysis failed. "
                                    + "Manual document review is required.",
                            "documentId="
                                    + documentId
                    );

                } catch (Exception updateException) {

                    System.out.println(
                            "Could not update failed AI status: "
                                    + updateException.getMessage()
                    );
                }
            }

        });

        /*
         * IMPORTANT:
         *
         * Return immediately.
         *
         * Gemini does NOT block the upload request anymore.
         */
        System.out.println("======================================");
        System.out.println("UPLOAD COMPLETED");
        System.out.println(
                "AI analysis running in background."
        );
        System.out.println(
                "Returning response to patient."
        );
        System.out.println("======================================");

        return savedDocument;
    }

    /*
     * Get all documents for a case.
     */
    public List<MedicalDocument> getDocumentsByCase(
            Long caseId,
            Authentication authentication
    ) {

        Case patientCase = getCase(caseId);

        ensureCanView(
                patientCase,
                authentication
        );

        return medicalDocumentRepository
                .findByPatientCase(patientCase);
    }

    /*
     * Get a single medical document.
     */
    public MedicalDocument getDocument(
            Long documentId,
            Authentication authentication
    ) {

        MedicalDocument document =
                medicalDocumentRepository
                        .findById(documentId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Medical document not found"
                                )
                        );

        ensureCanView(
                document.getPatientCase(),
                authentication
        );

        return document;
    }

    /*
     * Get physical document file.
     */
    public Resource getDocumentFile(
            Long documentId,
            Authentication authentication
    ) throws IOException {

        MedicalDocument document =
                getDocument(
                        documentId,
                        authentication
                );

        String actorRole =
                getActorRole(authentication);

        auditLogService.logAction(
                authentication.getName(),
                actorRole,
                "DOCUMENT_VIEWED",
                document.getPatientCase().getId(),
                "Medical document file was accessed.",
                "documentId="
                        + documentId
        );

        if (document.getFilePath() == null
                || document.getFilePath().isBlank()) {

            throw new RuntimeException(
                    "Document file path is not available"
            );
        }

        Path filePath =
                Paths.get(
                        document.getFilePath()
                ).normalize();

        Path uploadRoot =
                uploadDirectory
                        .toAbsolutePath()
                        .normalize();

        Path absoluteFilePath =
                filePath
                        .toAbsolutePath()
                        .normalize();

        /*
         * Security check:
         * file must remain inside upload directory.
         */
        if (!absoluteFilePath.startsWith(uploadRoot)) {

            throw new RuntimeException(
                    "Invalid document file path"
            );
        }

        if (!Files.exists(absoluteFilePath)
                || !Files.isRegularFile(absoluteFilePath)) {

            throw new RuntimeException(
                    "Document file not found on server"
            );
        }

        Resource resource =
                new UrlResource(
                        absoluteFilePath.toUri()
                );

        if (!resource.exists()
                || !resource.isReadable()) {

            throw new RuntimeException(
                    "Document file cannot be read"
            );
        }

        return resource;
    }

    /*
     * Delete medical document.
     */
    public void deleteDocument(
            Long documentId,
            Authentication authentication
    ) {

        MedicalDocument document =
                getDocument(
                        documentId,
                        authentication
                );

        if (!hasAuthority(
                authentication,
                "ROLE_DOCTOR"
        )
                && !hasAuthority(
                authentication,
                "ROLE_ADMIN"
        )) {

            throw new RuntimeException(
                    "Only doctor or admin can delete documents"
            );
        }

        if (document.getFilePath() != null) {

            try {

                Files.deleteIfExists(
                        Paths.get(
                                document.getFilePath()
                        )
                );

            } catch (IOException e) {

                System.out.println(
                        "Could not delete physical file: "
                                + e.getMessage()
                );
            }
        }

        Long caseId =
                document.getPatientCase() != null
                        ? document.getPatientCase().getId()
                        : null;

        medicalDocumentRepository.delete(document);

        auditLogService.logAction(
                authentication.getName(),
                getActorRole(authentication),
                "DOCUMENT_DELETED",
                caseId,
                "Medical document was deleted.",
                "documentId="
                        + documentId
        );
    }

    /*
     * Find case by ID.
     */
    private Case getCase(Long caseId) {

        return caseRepository
                .findById(caseId)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Case not found"
                        )
                );
    }

    /*
     * Validate upload permission.
     */
    private void ensureCanUpload(
            Case patientCase,
            Authentication authentication
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "Authentication required"
            );
        }

        if (!hasAuthority(
                authentication,
                "ROLE_PATIENT"
        )) {

            throw new RuntimeException(
                    "Only the patient can upload medical documents"
            );
        }

        User patient =
                patientCase.getPatient();

        if (patient == null
                || !patient.getEmail()
                .equalsIgnoreCase(
                        authentication.getName()
                )) {

            throw new RuntimeException(
                    "You can upload documents only to your own case"
            );
        }
    }

    /*
     * Validate document viewing permission.
     */
    private void ensureCanView(
            Case patientCase,
            Authentication authentication
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "Authentication required"
            );
        }

        if (hasAuthority(
                authentication,
                "ROLE_DOCTOR"
        )
                || hasAuthority(
                authentication,
                "ROLE_ADMIN"
        )) {

            return;
        }

        if (hasAuthority(
                authentication,
                "ROLE_PATIENT"
        )) {

            User patient =
                    patientCase.getPatient();

            if (patient != null
                    && patient.getEmail()
                    .equalsIgnoreCase(
                            authentication.getName()
                    )) {

                return;
            }
        }

        throw new RuntimeException(
                "You are not allowed to access this document"
        );
    }

    /*
     * Check authority.
     */
    private boolean hasAuthority(
            Authentication authentication,
            String authority
    ) {

        return authentication
                .getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(
                        authority::equals
                );
    }

    /*
     * Convert ROLE_DOCTOR -> DOCTOR.
     */
    private String getActorRole(
            Authentication authentication
    ) {

        if (authentication == null
                || authentication.getAuthorities() == null) {

            return "UNKNOWN";
        }

        return authentication
                .getAuthorities()
                .stream()
                .findFirst()
                .map(authority -> {

                    String value =
                            authority.getAuthority();

                    if (value.startsWith("ROLE_")) {
                        return value.substring(5);
                    }

                    return value;

                })
                .orElse("UNKNOWN");
    }

    /*
     * MultipartFile implementation used by the background
     * AI task.
     */
    private static class ByteArrayMultipartFile
            implements MultipartFile {

        private final byte[] content;
        private final String name;
        private final String originalFilename;
        private final String contentType;

        public ByteArrayMultipartFile(
                byte[] content,
                String originalFilename,
                String contentType
        ) {
            this.content = content;
            this.name = "file";
            this.originalFilename = originalFilename;
            this.contentType = contentType;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return content.length == 0;
        }

        @Override
        public long getSize() {
            return content.length;
        }

        @Override
        public byte[] getBytes() {
            return content;
        }

        @Override
        public java.io.InputStream getInputStream() {
            return new java.io.ByteArrayInputStream(content);
        }

        @Override
        public void transferTo(
                java.io.File dest
        ) throws IOException {

            Files.write(
                    dest.toPath(),
                    content
            );
        }
    }
}