package org.foodos.Utils;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    // These properties are needed to start the context, even if actual mail properties are from application.properties
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=password",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "google.oauth.client-id=test-client-id",
    "google.oauth.client-secret=test-client-secret",
    "google.oauth.redirect-uri=http://localhost:8080/login/oauth2/code/google"
})
public class EmailServiceIntegrationTest {

    @Autowired
    private Emailservice emailservice;

    @Test
    @Disabled("Enable this test to verify real email sending. Ensure valid mail properties are set in application.properties or overridden here.")
    void testSendRealEmail() {
        String to = "kunjgarala55@gmail.com"; // Change to your target email
        String subject = "Integration Test Email";
        String body = "This is a real email sent from the EmailServiceIntegrationTest.";

        try {
            emailservice.sendEmail(to, subject, body);
            System.out.println("Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            throw e;
        }
    }
}

