package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.MedicalDocument;
import AYUSH.Case.Taking.Backend.service.MedicalDocumentService;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class MedicalDocumentController {

    private final MedicalDocumentService medicalDocumentService;

    public MedicalDocumentController(
            MedicalDocumentService medicalDocumentService
    ) {
        this.medicalDocumentService = medicalDocumentService;
    }

    @PostMapping("/upload/{caseId}")
    public ResponseEntity<MedicalDocument> uploadDocument(
            @PathVariable Long caseId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws IOException {

        MedicalDocument document =
                medicalDocumentService.uploadDocument(
                        caseId,
                        file,
                        authentication
                );

        return ResponseEntity.ok(document);
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<MedicalDocument>> getCaseDocuments(
            @PathVariable Long caseId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                medicalDocumentService.getDocumentsByCase(
                        caseId,
                        authentication
                )
        );
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<MedicalDocument> getDocument(
            @PathVariable Long documentId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                medicalDocumentService.getDocument(
                        documentId,
                        authentication
                )
        );
    }

    @GetMapping("/{documentId}/file")
    public ResponseEntity<Resource> getDocumentFile(
            @PathVariable Long documentId,
            Authentication authentication
    ) throws IOException {

        MedicalDocument document =
                medicalDocumentService.getDocument(
                        documentId,
                        authentication
                );

        Resource resource =
                medicalDocumentService.getDocumentFile(
                        documentId,
                        authentication
                );

        MediaType mediaType =
                MediaType.APPLICATION_OCTET_STREAM;

        if (document.getFileType() != null &&
                !document.getFileType().isBlank()) {

            try {
                mediaType = MediaType.parseMediaType(
                        document.getFileType()
                );
            } catch (Exception ignored) {
                // Keep application/octet-stream
                // for unknown MIME types.
            }

        } else if (document.getFilePath() != null) {

            try {
                String detectedType =
                        Files.probeContentType(
                                Paths.get(document.getFilePath())
                        );

                if (detectedType != null) {
                    mediaType =
                            MediaType.parseMediaType(
                                    detectedType
                            );
                }

            } catch (Exception ignored) {
                // Keep application/octet-stream
                // if detection fails.
            }
        }

        String fileName =
                document.getFileName() != null
                        ? document.getFileName()
                        : "medical-document";

        ContentDisposition contentDisposition =
                ContentDisposition.inline()
                        .filename(fileName)
                        .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        contentDisposition.toString()
                )
                .body(resource);
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<String> deleteDocument(
            @PathVariable Long documentId,
            Authentication authentication
    ) {

        medicalDocumentService.deleteDocument(
                documentId,
                authentication
        );

        return ResponseEntity.ok(
                "Medical document deleted successfully."
        );
    }
}