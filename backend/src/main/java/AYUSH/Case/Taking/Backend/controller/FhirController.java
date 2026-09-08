package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.service.FhirService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fhir")
public class FhirController {

    private final FhirService fhirService;

    public FhirController(FhirService fhirService) {
        this.fhirService = fhirService;
    }

    /**
     * Returns a FHIR R4 Bundle for a patient case.
     *
     * Example:
     * GET /api/fhir/cases/1
     */
    @GetMapping(
            value = "/cases/{caseId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> getCaseAsFhir(
            @PathVariable Long caseId
    ) {

        String fhirBundle =
                fhirService.generateFhirBundle(caseId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(fhirBundle);
    }
}