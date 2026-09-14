package AYUSH.Case.Taking.Backend.controller;

import AYUSH.Case.Taking.Backend.entity.Doctor;
import AYUSH.Case.Taking.Backend.repository.DoctorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorRepository doctorRepository;

    public DoctorController(
            DoctorRepository doctorRepository
    ) {
        this.doctorRepository = doctorRepository;
    }

    @GetMapping("/approved")
    public ResponseEntity<List<Map<String, Object>>>
    getApprovedDoctors() {

        List<Map<String, Object>> doctors =
                doctorRepository.findAll()
                        .stream()
                        .filter(this::isApprovedDoctor)
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(doctors);
    }

    private boolean isApprovedDoctor(
            Doctor doctor
    ) {

        return doctor != null
                && doctor.getUser() != null
                && "DOCTOR".equalsIgnoreCase(
                        doctor.getUser().getRole()
                )
                && "APPROVED".equalsIgnoreCase(
                        doctor.getUser().getStatus()
                );
    }

    private Map<String, Object> toResponse(
            Doctor doctor
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "id",
                doctor.getUser().getId()
        );

        response.put(
                "doctorId",
                doctor.getId()
        );

        response.put(
                "name",
                doctor.getUser().getName()
        );

        response.put(
                "email",
                doctor.getUser().getEmail()
        );

        response.put(
                "medicalSystem",
                doctor.getMedicalSystem() == null
                        ? ""
                        : doctor.getMedicalSystem()
        );

        response.put(
                "registrationNumber",
                doctor.getRegistrationNumber()
        );

        response.put(
                "qualification",
                doctor.getQualification() == null
                        ? ""
                        : doctor.getQualification()
        );

        response.put(
                "specialization",
                doctor.getSpecialization() == null
                        ? ""
                        : doctor.getSpecialization()
        );

        response.put(
                "experienceYears",
                doctor.getExperienceYears() == null
                        ? 0
                        : doctor.getExperienceYears()
        );

        response.put(
                "hospital",
                doctor.getHospital() == null
                        ? ""
                        : doctor.getHospital()
        );

        response.put(
                "department",
                doctor.getDepartment() == null
                        ? ""
                        : doctor.getDepartment()
        );

        response.put(
                "city",
                doctor.getCity() == null
                        ? ""
                        : doctor.getCity()
        );

        response.put(
                "state",
                doctor.getState() == null
                        ? ""
                        : doctor.getState()
        );

        return response;
    }
}