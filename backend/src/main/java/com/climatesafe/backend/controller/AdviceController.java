package com.climatesafe.backend.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/advice")
public class AdviceController {

    // ✅ Updated endpoint for AI Chat with error handling
    @PostMapping("/chat")
    public ResponseEntity<?> getAdvice(@RequestBody Map<String, String> body) {
        String url = "http://127.0.0.1:5000/chat"; // Python microservice
        RestTemplate restTemplate = new RestTemplate();

        try {
            // Prepare request with headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            // Call Flask API
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return ResponseEntity.ok(response.getBody());

        } catch (HttpClientErrorException e) {
            // ✅ Capture Flask 404 or 400 JSON body instead of crashing
            return ResponseEntity.status(e.getStatusCode())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            // ✅ Fallback if Flask is unreachable
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to connect to AI service");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
