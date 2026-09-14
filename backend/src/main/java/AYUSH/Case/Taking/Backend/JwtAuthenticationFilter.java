package AYUSH.Case.Taking.Backend;

import AYUSH.Case.Taking.Backend.entity.User;
import AYUSH.Case.Taking.Backend.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String requestMethod = request.getMethod();

        // ============================================================
        // CORS PREFLIGHT
        // ============================================================

        if ("OPTIONS".equalsIgnoreCase(requestMethod)) {
            filterChain.doFilter(request, response);
            return;
        }

        // ============================================================
        // PUBLIC AUTH ENDPOINTS
        // ============================================================

        if (
                "/api/auth/login".equals(requestUri)
                        || "/api/auth/register".equals(requestUri)
                        || "/api/auth/register/patient".equals(requestUri)
                        || "/api/auth/register/doctor".equals(requestUri)
                        || "/api/auth/register/admin".equals(requestUri)
        ) {
            filterChain.doFilter(request, response);
            return;
        }

        // ============================================================
        // GET AUTHORIZATION HEADER
        // ============================================================

        String authHeader = request.getHeader("Authorization");

        if (
                authHeader == null
                        || !authHeader.startsWith("Bearer ")
        ) {
            filterChain.doFilter(request, response);
            return;
        }

        // ============================================================
        // EXTRACT TOKEN
        // ============================================================

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            // ========================================================
            // VALIDATE JWT
            // ========================================================

            if (!jwtService.isTokenValid(token)) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================================
            // EXTRACT EMAIL
            // ========================================================

            String email = jwtService.extractEmail(token);

            if (email == null || email.trim().isEmpty()) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            email = email.trim().toLowerCase();

            // ========================================================
            // LOAD CURRENT USER FROM DATABASE
            // ========================================================

            Optional<User> userOptional =
                    userRepository.findByEmailIgnoreCase(email);

            if (userOptional.isEmpty()) {

                System.out.println(
                        "JWT AUTHENTICATION FAILED: User not found: "
                                + email
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            User user = userOptional.get();

            // ========================================================
            // GET CURRENT DATABASE ROLE
            // ========================================================

            String role = user.getRole();

            if (
                    role == null
                            || role.trim().isEmpty()
                            || "NULL".equalsIgnoreCase(role.trim())
            ) {

                System.out.println(
                        "JWT AUTHENTICATION FAILED: Role missing for "
                                + email
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            role = role.trim().toUpperCase();

            // ========================================================
            // VALIDATE ROLE
            // ========================================================

            if (
                    !"PATIENT".equals(role)
                            && !"DOCTOR".equals(role)
                            && !"ADMIN".equals(role)
            ) {

                System.out.println(
                        "JWT AUTHENTICATION FAILED: Invalid role "
                                + role
                                + " for "
                                + email
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================================
            // STATUS CHECK
            //
            // PATIENT  -> ACTIVE
            // DOCTOR   -> APPROVED
            // ADMIN    -> ACTIVE
            //
            // Doctor registration starts as PENDING.
            // Only APPROVED doctors are allowed to access doctor APIs.
            // ========================================================

            String status = user.getStatus();

            if (status == null || status.trim().isEmpty()) {

                System.out.println(
                        "JWT AUTHENTICATION FAILED: Status missing for "
                                + email
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            status = status.trim().toUpperCase();

            boolean allowedStatus = false;

            if ("PATIENT".equals(role)) {
                allowedStatus = "ACTIVE".equals(status);
            } else if ("DOCTOR".equals(role)) {
                allowedStatus = "APPROVED".equals(status);
            } else if ("ADMIN".equals(role)) {
                allowedStatus = "ACTIVE".equals(status);
            }

            if (!allowedStatus) {

                System.out.println(
                        "======================================"
                );
                System.out.println(
                        "JWT AUTHENTICATION FAILED"
                );
                System.out.println(
                        "Request: "
                                + requestMethod
                                + " "
                                + requestUri
                );
                System.out.println(
                        "Email: " + email
                );
                System.out.println(
                        "Role: " + role
                );
                System.out.println(
                        "Status: " + status
                );
                System.out.println(
                        "Reason: User status does not allow login/access"
                );
                System.out.println(
                        "======================================"
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================================
            // CREATE SPRING SECURITY AUTHORITY
            // ========================================================

            String authorityName = "ROLE_" + role;

            SimpleGrantedAuthority authority =
                    new SimpleGrantedAuthority(authorityName);

            // ========================================================
            // CREATE AUTHENTICATION
            // ========================================================

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(authority)
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            // ========================================================
            // STORE AUTHENTICATION
            // ========================================================

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

            // ========================================================
            // DEBUG LOG
            // ========================================================

            System.out.println(
                    "======================================"
            );
            System.out.println(
                    "JWT AUTHENTICATION SUCCESS"
            );
            System.out.println(
                    "Request: "
                            + requestMethod
                            + " "
                            + requestUri
            );
            System.out.println(
                    "User: " + email
            );
            System.out.println(
                    "Role: " + role
            );
            System.out.println(
                    "Status: " + status
            );
            System.out.println(
                    "Authority: " + authorityName
            );
            System.out.println(
                    "======================================"
            );

        } catch (Exception e) {

            System.out.println(
                    "======================================"
            );
            System.out.println(
                    "JWT AUTHENTICATION FAILED"
            );
            System.out.println(
                    "Request: "
                            + requestMethod
                            + " "
                            + requestUri
            );
            System.out.println(
                    "Error: "
                            + e.getMessage()
            );
            System.out.println(
                    "======================================"
            );

            SecurityContextHolder.clearContext();
        }

        // ============================================================
        // CONTINUE FILTER CHAIN
        // ============================================================

        filterChain.doFilter(request, response);
    }
}