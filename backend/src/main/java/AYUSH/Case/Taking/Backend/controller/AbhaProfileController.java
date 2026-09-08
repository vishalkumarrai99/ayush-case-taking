package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.AbhaProfile;
import AYUSH.Case.Taking.Backend.service.AbhaProfileService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/abha/profile")
public class AbhaProfileController {

    private final AbhaProfileService abhaProfileService;

    public AbhaProfileController(
            AbhaProfileService abhaProfileService
    ) {
        this.abhaProfileService = abhaProfileService;
    }


    // =========================================================
    // SAVE / UPDATE MY ABHA PROFILE
    // =========================================================

    @PostMapping
    public ResponseEntity<?> saveMyProfile(
            @Valid @RequestBody AbhaProfileRequest request,
            Authentication authentication
    ) {

        try {

            String userEmail =
                    authentication.getName();

            AbhaProfile profile =
                    abhaProfileService.saveMyProfile(
                            userEmail,
                            request.getAbhaNumber(),
                            request.getAbhaAddress()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(toResponse(profile));

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ErrorResponse(
                                    e.getMessage()
                            )
                    );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ErrorResponse(
                                    e.getMessage()
                            )
                    );
        }
    }


    // =========================================================
    // GET MY ABHA PROFILE
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<?> getMyProfile(
            Authentication authentication
    ) {

        try {

            String userEmail =
                    authentication.getName();

            AbhaProfile profile =
                    abhaProfileService.getMyProfile(
                            userEmail
                    );

            return ResponseEntity.ok(
                    toResponse(profile)
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ErrorResponse(
                                    e.getMessage()
                            )
                    );
        }
    }


    // =========================================================
    // CHECK WHETHER MY PROFILE EXISTS
    // =========================================================

    @GetMapping("/my/exists")
    public ResponseEntity<ExistsResponse> profileExists(
            Authentication authentication
    ) {

        String userEmail =
                authentication.getName();

        boolean exists =
                abhaProfileService.hasMyProfile(
                        userEmail
                );

        return ResponseEntity.ok(
                new ExistsResponse(exists)
        );
    }


    // =========================================================
    // RESPONSE MAPPER
    // =========================================================
    //
    // We deliberately do NOT return the User entity.
    //
    // This prevents unnecessary patient account data
    // from being exposed through the ABHA API.
    //
    // =========================================================

    private AbhaProfileResponse toResponse(
            AbhaProfile profile
    ) {

        return new AbhaProfileResponse(
                profile.getId(),
                profile.getAbhaNumber(),
                profile.getAbhaAddress(),
                profile.getVerified(),
                profile.getVerificationSource(),
                profile.getVerifiedAt(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }


    // =========================================================
    // REQUEST DTO
    // =========================================================

    public static class AbhaProfileRequest {

        @Pattern(
                regexp = "^\\d{14}$",
                message = "ABHA number must contain exactly 14 digits"
        )
        @Size(
                min = 14,
                max = 14,
                message = "ABHA number must contain exactly 14 digits"
        )
        private String abhaNumber;

        @Pattern(
                regexp = "^$|^[a-zA-Z0-9._-]{3,50}@[a-zA-Z0-9._-]{2,50}$",
                message = "Invalid ABHA address format"
        )
        private String abhaAddress;


        public String getAbhaNumber() {
            return abhaNumber;
        }

        public void setAbhaNumber(
                String abhaNumber
        ) {
            this.abhaNumber = abhaNumber;
        }

        public String getAbhaAddress() {
            return abhaAddress;
        }

        public void setAbhaAddress(
                String abhaAddress
        ) {
            this.abhaAddress = abhaAddress;
        }
    }


    // =========================================================
    // RESPONSE DTO
    // =========================================================

    public static class AbhaProfileResponse {

        private Long id;

        private String abhaNumber;

        private String abhaAddress;

        private Boolean verified;

        private String verificationSource;

        private java.time.LocalDateTime verifiedAt;

        private java.time.LocalDateTime createdAt;

        private java.time.LocalDateTime updatedAt;


        public AbhaProfileResponse(
                Long id,
                String abhaNumber,
                String abhaAddress,
                Boolean verified,
                String verificationSource,
                java.time.LocalDateTime verifiedAt,
                java.time.LocalDateTime createdAt,
                java.time.LocalDateTime updatedAt
        ) {

            this.id = id;
            this.abhaNumber = abhaNumber;
            this.abhaAddress = abhaAddress;
            this.verified = verified;
            this.verificationSource = verificationSource;
            this.verifiedAt = verifiedAt;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }


        public Long getId() {
            return id;
        }

        public String getAbhaNumber() {
            return abhaNumber;
        }

        public String getAbhaAddress() {
            return abhaAddress;
        }

        public Boolean getVerified() {
            return verified;
        }

        public String getVerificationSource() {
            return verificationSource;
        }

        public java.time.LocalDateTime getVerifiedAt() {
            return verifiedAt;
        }

        public java.time.LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public java.time.LocalDateTime getUpdatedAt() {
            return updatedAt;
        }
    }


    // =========================================================
    // ERROR RESPONSE
    // =========================================================

    public static class ErrorResponse {

        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }


    // =========================================================
    // EXISTS RESPONSE
    // =========================================================

    public static class ExistsResponse {

        private boolean exists;

        public ExistsResponse(boolean exists) {
            this.exists = exists;
        }

        public boolean isExists() {
            return exists;
        }
    }
}