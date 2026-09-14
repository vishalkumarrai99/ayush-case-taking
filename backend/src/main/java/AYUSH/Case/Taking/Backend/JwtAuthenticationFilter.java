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
            // EXTRACT EMAIL FROM JWT
            // ========================================================

            String email = jwtService.extractEmail(token);

            if (email == null || email.trim().isEmpty()) {

                System.out.println(
                        "JWT AUTHENTICATION FAILED: Email missing"
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            email = email.trim().toLowerCase();

            // ========================================================
            // LOAD CURRENT USER FROM DATABASE
            //
            // IMPORTANT:
            // We do NOT blindly trust the role stored in the JWT.
            // The database is the source of truth for current role.
            // ========================================================

            Optional<User> userOptional =
                    userRepository.findByEmailIgnoreCase(email);

            if (userOptional.isEmpty()) {

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
                        "Reason: User not found"
                );
                System.out.println(
                        "Email: " + email
                );
                System.out.println(
                        "======================================"
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            User user = userOptional.get();

            // ========================================================
            // CHECK USER STATUS
            // ========================================================

            String userStatus = user.getStatus();

            if (
                    userStatus == null
                            || !"ACTIVE".equalsIgnoreCase(
                                    userStatus.trim()
                            )
            ) {

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
                        "Reason: User is not ACTIVE"
                );
                System.out.println(
                        "Email: " + email
                );
                System.out.println(
                        "Status: " + userStatus
                );
                System.out.println(
                        "======================================"
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================================
            // GET CURRENT ROLE FROM DATABASE
            // ========================================================

            String role = user.getRole();

            if (
                    role == null
                            || role.trim().isEmpty()
                            || "NULL".equalsIgnoreCase(role.trim())
            ) {

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
                        "Reason: Database role is missing"
                );
                System.out.println(
                        "Email: " + email
                );
                System.out.println(
                        "======================================"
                );

                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            role = role.trim().toUpperCase();

            // ========================================================
            // VALIDATE ALLOWED ROLES
            // ========================================================

            if (
                    !"PATIENT".equals(role)
                            && !"DOCTOR".equals(role)
                            && !"ADMIN".equals(role)
            ) {

                System.out.println(
                        "======================================"
                );
                System.out.println(
                        "JWT AUTHENTICATION FAILED"
                );
                System.out.println(
                        "Reason: Invalid database role"
                );
                System.out.println(
                        "Email: " + email
                );
                System.out.println(
                        "Role: " + role
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
                    "Database Role: " + role
            );
            System.out.println(
                    "Authority: " + authorityName
            );
            System.out.println(
                    "======================================"
            );

        } catch (Exception e) {

            // ========================================================
            // INVALID / EXPIRED JWT OR AUTHENTICATION ERROR
            // ========================================================

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