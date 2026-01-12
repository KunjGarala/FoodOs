package org.foodos.auth.DTO.Request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phoneNumber;
    private Long restaurantId;
    private String employeeCode;
    private String pin; // optional
    private String role; // OWNER, MANAGER, WAITER
}
