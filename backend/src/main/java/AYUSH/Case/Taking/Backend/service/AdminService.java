package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.Doctor;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.DoctorRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    public AdminService(
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.notificationService = notificationService;
    }

    // =========================================================
    // GET ALL PENDING DOCTORS
    // =========================================================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingDoctors() {

        List<Map<String, Object>> result = new ArrayList<>();

        List<Doctor> doctors = doctorRepository.findAll();

        for (Doctor doctor : doctors) {

            if (doctor == null || doctor.getUser() == null) {
                continue;
            }

            User user = doctor.getUser();

            boolean isDoctor =
                    user.getRole() != null
                            && (
                            "DOCTOR".equalsIgnoreCase(user.getRole())
                                    || "ROLE_DOCTOR".equalsIgnoreCase(user.getRole())
                    );

            boolean isPending =
                    user.getStatus() != null
                            && "PENDING".equalsIgnoreCase(user.getStatus());

            if (isDoctor && isPending) {
                result.add(convertDoctorToMap(doctor));
            }
        }

        return result;
    }

    // =========================================================
    // APPROVE DOCTOR
    // =========================================================

    @Transactional
    public Map<String, Object> approveDoctor(
            Long userId,
            String adminEmail
    ) {

        User doctorUser = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Doctor account not found.")
                );

        validateDoctor(doctorUser);

        if (!"PENDING".equalsIgnoreCase(doctorUser.getStatus())) {
            throw new RuntimeException(
                    "This doctor is no longer pending."
            );
        }

        doctorUser.setStatus("APPROVED");

        User savedUser = userRepository.save(doctorUser);

        // Notify doctor
        notificationService.createNotification(
                savedUser,
                null,
                "Doctor Account Approved",
                "Your doctor account has been approved by the administrator. You can now login and access the doctor dashboard.",
                "DOCTOR_APPROVED"
        );

        Map<String, Object> response = new LinkedHashMap<>();

        response.put(
                "message",
                "Doctor approved successfully."
        );

        response.put(
                "approvedBy",
                adminEmail
        );

        response.put(
                "doctor",
                convertUserToMap(savedUser)
        );

        return response;
    }

    // =========================================================
    // REJECT DOCTOR
    // =========================================================

    @Transactional
    public Map<String, Object> rejectDoctor(
            Long userId,
            String adminEmail,
            String reason
    ) {

        User doctorUser = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Doctor account not found.")
                );

        validateDoctor(doctorUser);

        if (!"PENDING".equalsIgnoreCase(doctorUser.getStatus())) {
            throw new RuntimeException(
                    "This doctor is no longer pending."
            );
        }

        String rejectionReason =
                reason != null && !reason.isBlank()
                        ? reason.trim()
                        : "Your registration was not approved by the administrator.";

        doctorUser.setStatus("REJECTED");

        User savedUser = userRepository.save(doctorUser);

        // Notify doctor
        notificationService.createNotification(
                savedUser,
                null,
                "Doctor Registration Rejected",
                "Your doctor registration has been rejected by the administrator. Reason: "
                        + rejectionReason,
                "DOCTOR_REJECTED"
        );

        Map<String, Object> response = new LinkedHashMap<>();

        response.put(
                "message",
                "Doctor registration rejected."
        );

        response.put(
                "rejectedBy",
                adminEmail
        );

        response.put(
                "reason",
                rejectionReason
        );

        response.put(
                "doctor",
                convertUserToMap(savedUser)
        );

        return response;
    }

    // =========================================================
    // VALIDATE DOCTOR
    // =========================================================

    private void validateDoctor(User user) {

        if (user.getRole() == null
                || !(
                "DOCTOR".equalsIgnoreCase(user.getRole())
                        || "ROLE_DOCTOR".equalsIgnoreCase(user.getRole())
        )) {

            throw new RuntimeException(
                    "Selected account is not a doctor account."
            );
        }
    }

    // =========================================================
    // DOCTOR -> RESPONSE MAP
    // =========================================================

    private Map<String, Object> convertDoctorToMap(
            Doctor doctor
    ) {

        User user = doctor.getUser();

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("userId", user.getId());
        map.put("doctorId", doctor.getId());

        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("mobile", user.getMobile());

        map.put("role", user.getRole());
        map.put("status", user.getStatus());
        map.put("createdAt", user.getCreatedAt());

        map.put(
                "medicalSystem",
                doctor.getMedicalSystem()
        );

        map.put(
                "registrationNumber",
                doctor.getRegistrationNumber()
        );

        map.put(
                "qualification",
                doctor.getQualification()
        );

        map.put(
                "specialization",
                doctor.getSpecialization()
        );

        map.put(
                "experienceYears",
                doctor.getExperienceYears()
        );

        map.put(
                "hospital",
                doctor.getHospital()
        );

        map.put(
                "department",
                doctor.getDepartment()
        );

        map.put(
                "city",
                doctor.getCity()
        );

        map.put(
                "state",
                doctor.getState()
        );

        return map;
    }

    private Map<String, Object> convertUserToMap(
            User user
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("mobile", user.getMobile());
        map.put("role", user.getRole());
        map.put("status", user.getStatus());
        map.put("createdAt", user.getCreatedAt());

        return map;
    }
}