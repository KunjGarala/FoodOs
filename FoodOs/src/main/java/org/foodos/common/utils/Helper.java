package org.foodos.common.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class Helper {

    @Value("${backend.port.url}")
    private String backendUrl;

    @Value("${frontend.port.url}")
    private String frontendPortUrl;

    public String generateEmailVerificationLink(String code) {
        return frontendPortUrl + "/verify-email?code=" + code;
    }
}
