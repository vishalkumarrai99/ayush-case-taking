package AYUSH.Case.Taking.Backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // =========================
                // SWAGGER / OPENAPI
                // =========================

                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**"
                )
                    .permitAll()

                // =========================
                // AUTH
                // =========================

                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login"
                )
                    .permitAll()

                // =========================
                // PATIENT
                // =========================

                .requestMatchers("/api/patient/**")
                    .hasAuthority("ROLE_PATIENT")

                // =========================
                // PATIENT CASE CREATION
                // =========================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/cases"
                )
                    .hasAuthority("ROLE_PATIENT")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/cases/my"
                )
                    .hasAuthority("ROLE_PATIENT")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/cases/*/resubmit"
                )
                    .hasAuthority("ROLE_PATIENT")

                // =========================
                // PATIENT CONSENT
                // =========================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/consents"
                )
                    .hasAuthority("ROLE_PATIENT")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/consents/my",
                    "/api/consents/my/latest"
                )
                    .hasAuthority("ROLE_PATIENT")

                // =========================
                // ABHA PROFILE
                // =========================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/abha/profile"
                )
                    .hasAuthority("ROLE_PATIENT")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/abha/profile/my",
                    "/api/abha/profile/my/exists"
                )
                    .hasAuthority("ROLE_PATIENT")

                // =========================
                // DOCTOR
                // =========================

                .requestMatchers("/api/doctor/**")
                    .hasAuthority("ROLE_DOCTOR")

                // =========================
                // ADMIN
                // =========================

                .requestMatchers("/api/admin/**")
                    .hasAuthority("ROLE_ADMIN")

                // =========================
                // CASE ACCESS
                // =========================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/cases"
                )
                    .hasAnyAuthority(
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                .requestMatchers(
                    "/api/cases/status/**"
                )
                    .hasAnyAuthority(
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/cases/*/verify",
                    "/api/cases/*/reject",
                    "/api/cases/*/notes",
                    "/api/cases/*/ai-verification"
                )
                    .hasAnyAuthority(
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/cases/*"
                )
                    .hasAnyAuthority(
                        "ROLE_PATIENT",
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                // =========================
                // FHIR R4
                // =========================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/fhir/cases/*"
                )
                    .hasAnyAuthority(
                        "ROLE_PATIENT",
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                // =========================
                // MEDICAL DOCUMENTS
                // =========================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/documents/upload/**"
                )
                    .hasAuthority("ROLE_PATIENT")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/documents/**"
                )
                    .hasAnyAuthority(
                        "ROLE_PATIENT",
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/documents/**"
                )
                    .hasAnyAuthority(
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                // =========================
                // NOTIFICATIONS
                // =========================

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/notifications/my",
                    "/api/notifications/my/unread",
                    "/api/notifications/my/unread/count"
                )
                    .hasAnyAuthority(
                        "ROLE_PATIENT",
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/notifications/*/read"
                )
                    .hasAnyAuthority(
                        "ROLE_PATIENT",
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/notifications/my/read-all"
                )
                    .hasAnyAuthority(
                        "ROLE_PATIENT",
                        "ROLE_DOCTOR",
                        "ROLE_ADMIN"
                    )

                // =========================
                // EVERYTHING ELSE
                // =========================

                .anyRequest().authenticated()
            )

            .httpBasic(httpBasic ->
                httpBasic.disable()
            )

            .formLogin(formLogin ->
                formLogin.disable()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}