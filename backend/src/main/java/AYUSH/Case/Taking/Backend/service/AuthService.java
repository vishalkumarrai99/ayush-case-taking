package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.JwtService;
import AYUSH.Case.Taking.Backend.dto.DoctorRegisterRequest;
import AYUSH.Case.Taking.Backend.dto.PatientRegisterRequest;
import AYUSH.Case.Taking.Backend.entity.Doctor;
import AYUSH.Case.Taking.Backend.entity.Patient;
import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.DoctorRepository;
import AYUSH.Case.Taking.Backend.repository.PatientRepository;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationService notificationService;

    public AuthService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            JwtService jwtService,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtService = jwtService;
        this.notificationService = notificationService;
    }


    private String normalizeEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new RuntimeException(
                    "Email is required"
            );
        }

        return email.trim().toLowerCase();
    }


    // =====================================================
    // PATIENT REGISTRATION
    // =====================================================

    @Transactional
    public User registerPatient(
            PatientRegisterRequest request
    ) {

        String email =
                normalizeEmail(
                        request.getEmail()
                );

        if (userRepository.existsByEmail(email)) {

            throw new RuntimeException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setName(
                request.getName()
        );

        user.setEmail(email);

        user.setMobile(
                request.getMobile()
        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole("PATIENT");

        user.setStatus("ACTIVE");

        User savedUser =
                userRepository.save(user);


        Patient patient =
                new Patient();

        patient.setUser(
                savedUser
        );

        patient.setDateOfBirth(
                request.getDateOfBirth()
        );

        patient.setGender(
                request.getGender()
        );

        patient.setAbhaNumber(
                request.getAbhaNumber()
        );

        patientRepository.save(
                patient
        );

        return savedUser;
    }


    // =====================================================
    // DOCTOR REGISTRATION
    // =====================================================

    @Transactional
    public User registerDoctor(
            DoctorRegisterRequest request
    ) {

        String email =
                normalizeEmail(
                        request.getEmail()
                );


        if (userRepository.existsByEmail(email)) {

            throw new RuntimeException(
                    "Email already registered"
            );
        }


        if (
            doctorRepository
                .existsByRegistrationNumber(
                    request.getRegistrationNumber()
                )
        ) {

            throw new RuntimeException(
                    "Medical registration number already registered"
            );
        }


        User user = new User();

        user.setName(
                request.getName()
        );

        user.setEmail(email);

        user.setMobile(
                request.getMobile()
        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole("DOCTOR");

        user.setStatus("PENDING");


        User savedUser =
                userRepository.save(
                        user
                );


        Doctor doctor =
                new Doctor();

        doctor.setUser(
                savedUser
        );

        doctor.setMedicalSystem(
                request.getMedicalSystem()
        );

        doctor.setRegistrationNumber(
                request.getRegistrationNumber()
        );

        doctor.setQualification(
                request.getQualification()
        );

        doctor.setSpecialization(
                request.getSpecialization()
        );

        doctor.setExperienceYears(
                request.getExperienceYears()
        );

        doctor.setHospital(
                request.getHospital()
        );

        doctor.setDepartment(
                request.getDepartment()
        );

        doctor.setCity(
                request.getCity()
        );

        doctor.setState(
                request.getState()
        );


        doctorRepository.save(
                doctor
        );


        // =================================================
        // NOTIFY ADMINS
        // =================================================

        userRepository.findAll()
                .stream()
                .filter(
                    existingUser ->
                        "ADMIN".equalsIgnoreCase(
                            existingUser.getRole()
                        )
                )
                .forEach(
                    admin -> {

                        notificationService
                            .createNotification(
                                admin,
                                null,

                                "New Doctor Registration",

                                "A new doctor, "
                                    + savedUser.getName()
                                    + ", has registered and is "
                                    + "waiting for admin approval.",

                                "DOCTOR_REGISTRATION"
                            );
                    }
                );


        return savedUser;
    }


    // =====================================================
    // GET USER BY EMAIL
    // =====================================================

    public User getUserByEmail(
            String email
    ) {

        String normalizedEmail =
                normalizeEmail(
                        email
                );

        return userRepository
                .findByEmail(
                        normalizedEmail
                )
                .orElseThrow(
                    () ->
                        new RuntimeException(
                            "User not found"
                        )
                );
    }


    // =====================================================
    // LOGIN
    // =====================================================

    public String loginUser(
            String email,
            String password
    ) {

        String normalizedEmail =
                normalizeEmail(
                        email
                );


        if (
            password == null ||
            password.isBlank()
        ) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }


        User user =
                userRepository
                    .findByEmail(
                        normalizedEmail
                    )
                    .orElseThrow(
                        () ->
                            new RuntimeException(
                                "Invalid email or password"
                            )
                    );


        // =================================================
        // PASSWORD CHECK
        // =================================================

        if (
            !passwordEncoder.matches(
                password,
                user.getPassword()
            )
        ) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }


        // =================================================
        // DOCTOR APPROVAL CHECK
        // =================================================

        if (
            "DOCTOR".equalsIgnoreCase(
                user.getRole()
            )
            &&
            !"APPROVED".equalsIgnoreCase(
                user.getStatus()
            )
        ) {

            throw new RuntimeException(
                    "Doctor account is pending admin approval"
            );
        }


        // =================================================
        // USER STATUS CHECK
        // =================================================

        if (
            user.getStatus() != null
            &&
            "BLOCKED".equalsIgnoreCase(
                user.getStatus()
            )
        ) {

            throw new RuntimeException(
                    "Your account has been blocked"
            );
        }


        // =================================================
        // JWT
        // =================================================

        return jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );
    }
}