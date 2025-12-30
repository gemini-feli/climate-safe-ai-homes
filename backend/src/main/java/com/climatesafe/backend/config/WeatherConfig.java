package com.climatesafe.backend.config;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WeatherConfig {

    @Value("${openweather.api.key}")
    private String apiKey;



    public String getApiKey() {
        return apiKey;
    }

    @PostConstruct
    public void printKey() {
        System.out.println(">>> Loaded API Key: " + apiKey);
    }
}
