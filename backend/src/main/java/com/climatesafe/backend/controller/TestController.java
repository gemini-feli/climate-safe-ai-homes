package com.climatesafe.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/test")
    public String testConnection() {
        return "✅ Backend is reachable!";
    }
}
