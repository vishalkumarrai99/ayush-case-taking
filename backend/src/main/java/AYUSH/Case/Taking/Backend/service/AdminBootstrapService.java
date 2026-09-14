package AYUSH.Case.Taking.Backend.service;

import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBootstrapService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AdminBootstrapService(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public User registerFirstAdmin(
            String name,
            String email,
            String password
    ) {

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Admin name is required");
        }

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Admin email is required");
        }

        if (password == null || password.length() < 8) {
            throw new RuntimeException(
                    "Admin password must be at least 8 characters"
            );
        }

        if (userRepository.existsByRole("ADMIN")) {
            throw new RuntimeException(
                    "Admin account already exists"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setName(name.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(
                passwordEncoder.encode(password)
        );
        user.setRole("ADMIN");
        user.setStatus("ACTIVE");

        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException(
                    "Admin account already exists"
            );
        }
    }
}