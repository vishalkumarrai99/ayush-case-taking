package AYUSH.Case.Taking.Backend.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRequest(

        @NotNull
        Long doctorId,

        @NotNull
        @FutureOrPresent
        LocalDate appointmentDate,

        @NotNull
        LocalTime appointmentTime,

        @NotBlank
        String reason

) {
}
