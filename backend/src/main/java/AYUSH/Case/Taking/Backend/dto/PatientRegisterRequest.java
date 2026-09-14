package AYUSH.Case.Taking.Backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PatientRegisterRequest {

    private String name;
    private String email;
    private String mobile;
    private String password;

    private LocalDate dateOfBirth;
    private String gender;
    private String abhaNumber;
}