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
public class AdminDoctorService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    public AdminDoctorService(
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.notificationService = notificationService;
    }

    /**
     * Get all doctors whose account is waiting for admin approval.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingDoctors() {

        List<Map<String, Object>> result = new ArrayList<>();

        List<Doctor> doctors = doctorRepository.findAll();

        for (Doctor doctor : doctors) {

            User user = doctor.getUser();

            if (user == null) {
                continue;
            }

            if (!"DOCTOR".equalsIgnoreCase(user.getRole())) {
                continue;
            }

            if (!"PENDING".equalsIgnoreCase(user.getStatus())) {
                continue;
            }

            Map<String, Object> doctorData = new LinkedHashMap<>();

            doctorData.put("userId", user.getId());
            doctorData.put("doctorId", doctor.getId());

            // Basic information
            doctorData.put("name", user.getName());
            doctorData.put("email", user.getEmail());
            doctorData.put("mobile", user.getMobile());

            // Account information
            doctorData.put("role", user.getRole());
            doctorData.put("status", user.getStatus());
            doctorData.put("createdAt", user.getCreatedAt());

            // Professional information
            doctorData.put(
                    "medicalSystem",
                    doctor.getMedicalSystem()
            );

            doctorData.put(
                    "registrationNumber",
                    doctor.getRegistrationNumber()
            );

            doctorData.put(
                    "qualification",
                    doctor.getQualification()
            );

            doctorData.put(
                    "specialization",
                    doctor.getSpecialization()
            );

            doctorData.put(
                    "experienceYears",
                    doctor.getExperienceYears()
            );

            doctorData.put(
                    "hospital",
                    doctor.getHospital()
            );

            doctorData.put(
                    "department",
                    doctor.getDepartment()
            );

            doctorData.put(
                    "city",
                    doctor.getCity()
            );

            doctorData.put(
                    "state",
                    doctor.getState()
            );

            result.add(doctorData);
        }

        return result;
    }

    /**
     * Approve a pending doctor.
     */
    @Transactional
    public Map<String, Object> approveDoctor(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Doctor account not found")
                );

        if (!"DOCTOR".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        if (!"PENDING".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException(
                    "Doctor account is already " + user.getStatus()
            );
        }

        user.setStatus("APPROVED");

        User savedUser = userRepository.save(user);

        // Notify the doctor
        notificationService.createNotification(
                savedUser,
                null,
                "Doctor Account Approved",
                "Congratulations! Your doctor registration has been approved by the administrator. You can now login to the AYUSH Care doctor portal.",
                "DOCTOR_APPROVED"
        );

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Doctor approved successfully");
        response.put("userId", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("status", savedUser.getStatus());

        return response;
    }

    /**
     * Reject a pending doctor.
     */
    @Transactional
    public Map<String, Object> rejectDoctor(
            Long userId,
            String reason
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Doctor account not found")
                );

        if (!"DOCTOR".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Selected user is not a doctor");
        }

        if (!"PENDING".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException(
                    "Doctor account is already " + user.getStatus()
            );
        }

        user.setStatus("REJECTED");

        User savedUser = userRepository.save(user);

        String rejectionReason =
                reason == null || reason.trim().isEmpty()
                        ? "No specific reason was provided."
                        : reason.trim();

        // Notify the doctor
        notificationService.createNotification(
                savedUser,
                null,
                "Doctor Registration Rejected",
                "Your doctor registration has been rejected by the administrator. Reason: "
                        + rejectionReason,
                "DOCTOR_REJECTED"
        );

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("message", "Doctor rejected successfully");
        response.put("userId", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("status", savedUser.getStatus());
        response.put("reason", rejectionReason);

        return response;
    }
}