package org.foodos.config;

import lombok.RequiredArgsConstructor;
import org.foodos.restaurant.interceptor.HibernateFilterInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private  final HibernateFilterInterceptor hibernateFilterInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry){
        registry.addInterceptor(hibernateFilterInterceptor)
                .addPathPatterns("/api/**");
    }
}
