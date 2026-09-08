package AYUSH.Case.Taking.Backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME =
            "Bearer Authentication";

    @Bean
    public OpenAPI ayushOpenAPI() {

        return new OpenAPI()

                .info(
                        new Info()
                                .title(
                                        "AYUSH Patient Case-Taking API"
                                )
                                .description(
                                        "API documentation for the AYUSH " +
                                        "Patient Case-Taking Software. " +
                                        "The platform supports patient case " +
                                        "intake, AYUSH assessment, doctor " +
                                        "review, notifications, consent, " +
                                        "ABHA/ABDM foundation and FHIR R4 " +
                                        "interoperability."
                                )
                                .version("1.0.0")
                                .contact(
                                        new Contact()
                                                .name(
                                                        "AYUSH Case-Taking Team"
                                                )
                                )
                )

                .components(
                        new Components()
                                .addSecuritySchemes(
                                        SECURITY_SCHEME_NAME,
                                        new SecurityScheme()
                                                .name(
                                                        SECURITY_SCHEME_NAME
                                                )
                                                .type(
                                                        SecurityScheme.Type.HTTP
                                                )
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                                .description(
                                                        "Enter your JWT token. " +
                                                        "Example: eyJhbGciOiJIUzI1NiJ9..."
                                                )
                                )
                )

                .addSecurityItem(
                        new SecurityRequirement()
                                .addList(
                                        SECURITY_SCHEME_NAME
                                )
                );
    }
}