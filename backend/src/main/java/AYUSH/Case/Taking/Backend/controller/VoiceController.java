package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.service.BhashiniAsrService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/voice")
public class VoiceController {

    private final BhashiniAsrService bhashiniAsrService;

    public VoiceController(BhashiniAsrService bhashiniAsrService) {
        this.bhashiniAsrService = bhashiniAsrService;
    }

    @PostMapping(
            value = "/transcribe",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<?> transcribe(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(value = "language", defaultValue = "hi") String language
    ) {
        try {
            Map<String, Object> result =
                    bhashiniAsrService.transcribe(audio, language);

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );

        } catch (IllegalStateException e) {
            return ResponseEntity.status(503).body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", "Unable to read audio."
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message",
                            e.getMessage() != null
                                    ? e.getMessage()
                                    : "Bhashini transcription failed."
                    )
            );
        }
    }
}
