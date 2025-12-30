package com.climatesafe.backend.controller;

import com.climatesafe.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AlertController {

    @Autowired
    private NotificationService notificationService;

    private Map<String, String> userTokens = new HashMap<>();

    // ✅ Save or update token for a user
    @PostMapping("/registerToken")
    public Map<String, String> registerToken(@RequestParam String userId, @RequestParam String token) {
        userTokens.put(userId, token);
        return Map.of("message", "Token registered successfully for user: " + userId);
    }

    // ✅ Send notification manually (for testing)
    @PostMapping("/send")
    public Map<String, String> sendNotification(@RequestParam String userId,
                                                @RequestParam String title,
                                                @RequestParam String body) {
        try {
            String token = userTokens.get(userId);
            if (token == null) {
                return Map.of("error", "No token found for userId: " + userId);
            }
            String response = notificationService.sendToToken(token, title, body);
            return Map.of("success", "Notification sent successfully!", "response", response);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", e.getMessage());
        }
    }
}
