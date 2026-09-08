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

        // ==========================================
        // CORS PREFLIGHT REQUEST
        // ==========================================
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        // ==========================================
        // NO JWT TOKEN
        // ==========================================
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {

            // ==========================================
            // VALIDATE JWT
            // ==========================================
            if (jwtService.isTokenValid(token)) {

                String email = jwtService.extractEmail(token);
                String role = jwtService.extractRole(token);

                if (role != null) {
                    role = role.trim().toUpperCase();
                }

                String authorityName = "ROLE_" + role;

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(authorityName);

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

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);

                System.out.println("======================================");
                System.out.println("JWT AUTHENTICATION SUCCESS");
                System.out.println("Request: " + request.getMethod()
                        + " " + request.getRequestURI());
                System.out.println("User: " + email);
                System.out.println("Role: " + role);
                System.out.println("Authority: " + authorityName);
                System.out.println("======================================");
            }

        } catch (Exception e) {

            System.out.println("======================================");
            System.out.println("JWT AUTHENTICATION FAILED");
            System.out.println("Request: " + request.getMethod()
                    + " " + request.getRequestURI());
            System.out.println("Error: " + e.getMessage());
            System.out.println("======================================");

            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}