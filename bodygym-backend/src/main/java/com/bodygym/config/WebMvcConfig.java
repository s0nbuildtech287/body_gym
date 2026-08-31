package com.bodygym.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Look for exercises-dataset in parent or workspace
        String userDir = System.getProperty("user.dir");
        
        // Check candidate image & video folders
        String[] candidateImagePaths = {
            "file:" + userDir + "/../exercises-dataset/images/",
            "file:" + userDir + "/exercises-dataset/images/",
            "file:/app/exercises-dataset/images/",
            "file:///C:/Users/XUAN%20SON/Desktop/Xuan%20Son%20Version/BodyGym/exercises-dataset/images/"
        };
        
        String[] candidateVideoPaths = {
            "file:" + userDir + "/../exercises-dataset/videos/",
            "file:" + userDir + "/exercises-dataset/videos/",
            "file:/app/exercises-dataset/videos/",
            "file:///C:/Users/XUAN%20SON/Desktop/Xuan%20Son%20Version/BodyGym/exercises-dataset/videos/"
        };

        registry.addResourceHandler("/media/images/**")
                .addResourceLocations(candidateImagePaths);

        registry.addResourceHandler("/media/videos/**")
                .addResourceLocations(candidateVideoPaths);

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
    }
}
