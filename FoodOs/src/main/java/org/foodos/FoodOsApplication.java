package org.foodos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FoodOsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoodOsApplication.class, args);
    }

}
