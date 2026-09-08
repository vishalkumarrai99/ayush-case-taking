package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.AbhaProfile;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.AbhaProfileRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AbhaProfileService {

    private final AbhaProfileRepository abhaProfileRepository;
    private final UserRepository userRepository;

    private static final Pattern ABHA_NUMBER_PATTERN =
            Pattern.compile("^\\d{14}$");

    private static final Pattern ABHA_ADDRESS_PATTERN =
            Pattern.compile(
                    "^[a-zA-Z0-9._-]{3,50}@[a-zA-Z0-9._-]{2,50}$"
            );

    public AbhaProfileService(
            AbhaProfileRepository abhaProfileRepository,
            UserRepository userRepository
    ) {
        this.abhaProfileRepository = abhaProfileRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // CREATE / UPDATE MY ABHA PROFILE
    // =========================================================

    @Transactional
    public AbhaProfile saveMyProfile(
            String userEmail,
            String abhaNumber,
            String abhaAddress
    ) {

        User user = userRepository
                .findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        validateAbhaNumber(abhaNumber);

        if (abhaAddress != null &&
                !abhaAddress.trim().isEmpty()) {

            validateAbhaAddress(abhaAddress);
        }

        Optional<AbhaProfile> existingProfile =
                abhaProfileRepository.findByUserId(
                        user.getId()
                );

        AbhaProfile profile;

        if (existingProfile.isPresent()) {

            profile = existingProfile.get();

            // -------------------------------------------------
            // Check if ABHA number belongs to another profile
            // -------------------------------------------------

            Optional<AbhaProfile> numberOwner =
                    abhaProfileRepository
                            .findByAbhaNumber(abhaNumber);

            if (numberOwner.isPresent() &&
                    !numberOwner.get()
                            .getId()
                            .equals(profile.getId())) {

                throw new IllegalArgumentException(
                        "This ABHA number is already linked to another account"
                );
            }

            // -------------------------------------------------
            // Check ABHA address uniqueness
            // -------------------------------------------------

            if (abhaAddress != null &&
                    !abhaAddress.trim().isEmpty()) {

                Optional<AbhaProfile> addressOwner =
                        abhaProfileRepository
                                .findByAbhaAddress(
                                        abhaAddress
                                );

                if (addressOwner.isPresent() &&
                        !addressOwner.get()
                                .getId()
                                .equals(profile.getId())) {

                    throw new IllegalArgumentException(
                            "This ABHA address is already linked to another account"
                    );
                }
            }

        } else {

            // -------------------------------------------------
            // New profile
            // -------------------------------------------------

            if (abhaProfileRepository
                    .existsByAbhaNumber(abhaNumber)) {

                throw new IllegalArgumentException(
                        "This ABHA number is already linked to another account"
                );
            }

            if (abhaAddress != null &&
                    !abhaAddress.trim().isEmpty() &&
                    abhaProfileRepository
                            .existsByAbhaAddress(abhaAddress)) {

                throw new IllegalArgumentException(
                        "This ABHA address is already linked to another account"
                );
            }

            profile = new AbhaProfile();

            profile.setUser(user);
        }

        // =====================================================
        // SAVE USER-PROVIDED ABHA DETAILS
        // =====================================================

        profile.setAbhaNumber(
                abhaNumber.trim()
        );

        if (abhaAddress != null &&
                !abhaAddress.trim().isEmpty()) {

            profile.setAbhaAddress(
                    abhaAddress.trim()
            );

        } else {

            profile.setAbhaAddress(null);
        }

        // =====================================================
        // IMPORTANT
        // =====================================================
        //
        // Entering an ABHA number does NOT mean that ABDM
        // verification has happened.
        //
        // Therefore we explicitly keep:
        //
        // verified = false
        // verificationSource = NOT_VERIFIED
        //
        // until a real ABDM verification flow is integrated.
        //
        // =====================================================

        profile.setVerified(false);

        profile.setVerificationSource(
                "NOT_VERIFIED"
        );

        profile.setVerifiedAt(null);

        return abhaProfileRepository.save(
                profile
        );
    }


    // =========================================================
    // GET MY ABHA PROFILE
    // =========================================================

    @Transactional(readOnly = true)
    public AbhaProfile getMyProfile(
            String userEmail
    ) {

        User user = userRepository
                .findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        return abhaProfileRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "ABHA profile not found"
                        )
                );
    }


    // =========================================================
    // CHECK WHETHER PROFILE EXISTS
    // =========================================================

    @Transactional(readOnly = true)
    public boolean hasMyProfile(
            String userEmail
    ) {

        User user = userRepository
                .findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        return abhaProfileRepository
                .existsByUserId(user.getId());
    }


    // =========================================================
    // ABHA NUMBER VALIDATION
    // =========================================================

    private void validateAbhaNumber(
            String abhaNumber
    ) {

        if (abhaNumber == null ||
                abhaNumber.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "ABHA number is required"
            );
        }

        String cleanedNumber =
                abhaNumber
                        .trim()
                        .replaceAll("\\s+", "");

        if (!ABHA_NUMBER_PATTERN
                .matcher(cleanedNumber)
                .matches()) {

            throw new IllegalArgumentException(
                    "ABHA number must contain exactly 14 digits"
            );
        }
    }


    // =========================================================
    // ABHA ADDRESS VALIDATION
    // =========================================================

    private void validateAbhaAddress(
            String abhaAddress
    ) {

        String cleanedAddress =
                abhaAddress.trim();

        if (!ABHA_ADDRESS_PATTERN
                .matcher(cleanedAddress)
                .matches()) {

            throw new IllegalArgumentException(
                    "Invalid ABHA address format"
            );
        }
    }
}