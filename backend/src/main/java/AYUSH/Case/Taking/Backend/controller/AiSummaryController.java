package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.Case;
import AYUSH.Case.Taking.Backend.repository.CaseRepository;
import AYUSH.Case.Taking.Backend.service.AiSummaryService;
import AYUSH.Case.Taking.Backend.service.CaseService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiSummaryController {

    private final AiSummaryService aiSummaryService;
    private final CaseService caseService;
    private final CaseRepository caseRepository;

    public AiSummaryController(
            AiSummaryService aiSummaryService,
            CaseService caseService,
            CaseRepository caseRepository
    ) {
        this.aiSummaryService = aiSummaryService;
        this.caseService = caseService;
        this.caseRepository = caseRepository;
    }

    @PostMapping("/summary/{caseId}")
    public ResponseEntity<Case> generateSummary(
            @PathVariable Long caseId
    ) {

        // Get patient case from database
        Case patientCase =
                caseService.getCaseById(caseId);

        // Send case information to Gemini
        String summary =
                aiSummaryService.generateSummary(patientCase);

        // Save AI-generated summary
        patientCase.setAiSummary(summary);

        Case savedCase =
                caseRepository.save(patientCase);

        return ResponseEntity.ok(savedCase);
    }
}