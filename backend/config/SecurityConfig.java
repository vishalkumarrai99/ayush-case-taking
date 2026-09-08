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
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ==========================================
                        // PUBLIC AUTH APIs
                        // ==========================================

                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login"
                        ).permitAll()


                        // ==========================================
                        // PATIENT APIs
                        // ==========================================

                        .requestMatchers(
                                "/api/patient/**"
                        )
                        .hasAuthority("ROLE_PATIENT")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/cases"
                        )
                        .hasAuthority("ROLE_PATIENT")

                        .requestMatchers(
                                "/api/cases/my"
                        )
                        .hasAuthority("ROLE_PATIENT")


                        // ==========================================
                        // DOCTOR APIs
                        // ==========================================

                        .requestMatchers(
                                "/api/doctor/**"
                        )
                        .hasAuthority("ROLE_DOCTOR")


                        // ==========================================
                        // ADMIN APIs
                        // ==========================================

                        .requestMatchers(
                                "/api/admin/**"
                        )
                        .hasAuthority("ROLE_ADMIN")


                        // ==========================================
                        // DOCTOR / ADMIN CASE MANAGEMENT
                        // ==========================================

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


                        // ==========================================
                        // DOCTOR / ADMIN CASE ACTIONS
                        // ==========================================

                        .requestMatchers(
                                "/api/cases/*/verify",
                                "/api/cases/*/reject",
                                "/api/cases/*/notes",
                                "/api/cases/*/ai-verification"
                        )
                        .hasAnyAuthority(
                                "ROLE_DOCTOR",
                                "ROLE_ADMIN"
                        )


                        // ==========================================
                        // SINGLE CASE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/cases/*"
                        )
                        .hasAnyAuthority(
                                "ROLE_PATIENT",
                                "ROLE_DOCTOR",
                                "ROLE_ADMIN"
                        )


                        // ==========================================
                        // MEDICAL DOCUMENT UPLOAD
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/documents/upload/**"
                        )
                        .hasAuthority("ROLE_PATIENT")


                        // ==========================================
                        // MEDICAL DOCUMENT VIEW
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/documents/**"
                        )
                        .hasAnyAuthority(
                                "ROLE_PATIENT",
                                "ROLE_DOCTOR",
                                "ROLE_ADMIN"
                        )


                        // ==========================================
                        // MEDICAL DOCUMENT DELETE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/documents/**"
                        )
                        .hasAnyAuthority(
                                "ROLE_DOCTOR",
                                "ROLE_ADMIN"
                        )


                        // ==========================================
                        // EVERYTHING ELSE
                        // ==========================================

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