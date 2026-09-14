package AYUSH.Case.Taking.Backend;

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

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
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
        //
        // Login and registration must NEVER be affected by an old
        // or expired JWT stored in the browser.
        // ============================================================

        if (
                "/api/auth/login".equals(requestUri)
                        || "/api/auth/register/patient".equals(requestUri)
                        || "/api/auth/register/doctor".equals(requestUri)
        ) {

            filterChain.doFilter(request, response);
            return;
        }

        // ============================================================
        // GET AUTHORIZATION HEADER
        // ============================================================

        String authHeader = request.getHeader("Authorization");

        // ============================================================
        // NO JWT TOKEN
        // ============================================================

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
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

            if (jwtService.isTokenValid(token)) {

                String email = jwtService.extractEmail(token);
                String role = jwtService.extractRole(token);

                // ====================================================
                // VALIDATE EMAIL
                // ====================================================

                if (email == null || email.trim().isEmpty()) {
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                // ====================================================
                // NORMALIZE ROLE
                // ====================================================

                if (role != null) {
                    role = role.trim().toUpperCase();
                }

                // ====================================================
                // ROLE CHECK
                // ====================================================

                if (
                        role == null
                                || role.isEmpty()
                                || "NULL".equals(role)
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
                            "Reason: JWT role is missing"
                    );

                    System.out.println(
                            "======================================"
                    );

                    SecurityContextHolder.clearContext();

                    filterChain.doFilter(request, response);
                    return;
                }

                // ====================================================
                // CREATE SPRING SECURITY AUTHORITY
                // ====================================================

                String authorityName = "ROLE_" + role;

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(
                                authorityName
                        );

                // ====================================================
                // CREATE AUTHENTICATION
                // ====================================================

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

                // ====================================================
                // STORE AUTHENTICATION
                // ====================================================

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);

                // ====================================================
                // DEBUG LOG
                // ====================================================

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
                        "User: "
                                + email
                );

                System.out.println(
                        "Role: "
                                + role
                );

                System.out.println(
                        "Authority: "
                                + authorityName
                );

                System.out.println(
                        "======================================"
                );
            }

        } catch (Exception e) {

            // ========================================================
            // INVALID / EXPIRED JWT
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