package org.foodos.Utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class Helper {


    @Value("${backend.port.url}")
    private String backendUrl;

    public String generateEmailVerificationLink(String code) {
        return backendUrl + "/auth/verify-email?code=" + code;
    }
}
