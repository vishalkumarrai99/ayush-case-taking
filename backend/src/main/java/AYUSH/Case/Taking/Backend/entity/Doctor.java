package AYUSH.Case.Taking.Backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "medical_system")
    private String medicalSystem;

    @Column(nullable = false, unique = true)
    private String registrationNumber;

    private String qualification;

    private String specialization;

    private Integer experienceYears;

    private String hospital;

    private String department;

    private String city;

    private String state;
}