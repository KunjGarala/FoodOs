package org.foodos.Utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class Emailservice {

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.properties.domain_name:foodos@example.com}")
    String from;

    public void sendEmail(String to, String subject, String body) {
        // Implementation for sending email

        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(to);
        mailMessage.setSubject(subject);
        mailMessage.setText(body);
        mailMessage.setFrom(from);
        javaMailSender.send(mailMessage);

    }
}
