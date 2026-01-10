package org.foodos.auth.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RequestMapping("/")
@RestController
public class TempController {

    @GetMapping
    public String hello(){
        return "Hello from FoodOs Auth Service!";
    }
}
