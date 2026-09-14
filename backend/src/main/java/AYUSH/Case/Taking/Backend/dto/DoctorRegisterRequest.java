package AYUSH.Case.Taking.Backend.dto;

import lombok.Data;

@Data
public class DoctorRegisterRequest {

    private String name;
    private String email;
    private String mobile;
    private String password;

    private String medicalSystem;
    private String registrationNumber;
    private String qualification;
    private String specialization;
    private Integer experienceYears;
    private String hospital;
    private String department;
    private String city;
    private String state;
}