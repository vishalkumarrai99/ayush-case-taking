package AYUSH.Case.Taking.Backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RoleTestController {

    @GetMapping("/patient/test")
    public String patientTest() {
        return "Patient API access successful.";
    }

    @GetMapping("/doctor/test")
    public String doctorTest() {
        return "Doctor API access successful.";
    }

    @GetMapping("/admin/test")
    public String adminTest() {
        return "Admin API access successful.";
    }
}