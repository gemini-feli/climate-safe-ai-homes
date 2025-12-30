package com.climatesafe.backend.controller;

import com.climatesafe.backend.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.json.JSONObject;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class WeatherController {

    @Autowired
    private WeatherService weatherService;

    @GetMapping("/all-alerts")
    public Map<String, Object> getAllAlerts(@RequestParam double lat, @RequestParam double lon) {
        Map<String, Object> response = new HashMap<>();
        JSONObject weatherData = weatherService.getWeather(lat, lon);

        if (weatherData.has("error")) {
            response.put("error", weatherData.getString("error"));
            return response;
        }

        double temp = weatherData.optDouble("temperature", 0.0);
        int humidity = weatherData.optInt("humidity", 0);
        double rainfall = weatherData.optDouble("rainfall", 0.0);

        Map<String, String> alerts = new HashMap<>();
        
        alerts.put("flood", rainfall > 20 ? 
            "⚠️ Flood Risk: Heavy rainfall detected (" + rainfall + " mm). Stay indoors, avoid waterlogged areas." :
            "✅ No Flood Risk: " + rainfall + " mm rainfall");
            
        alerts.put("rainfall", rainfall > 10 ? 
            "🌧️ Heavy Rainfall Expected: " + rainfall + " mm." :
            "✅ Normal Rainfall: " + rainfall + " mm.");
            
        alerts.put("landslide", (rainfall > 30 && humidity > 50) ? 
            "⛰️ Landslide Risk: Heavy rain + high humidity detected. Avoid slopes and unstable terrain." :
            "✅ No Landslide Risk");
            
        alerts.put("heatwave", temp > 25 ? 
            "🔥 Heatwave Warning: Current temp " + temp + "°C. Drink water, avoid outdoor activities." :
            "✅ Normal Temperature: " + temp + "°C");

        try {
            RestTemplate restTemplate = new RestTemplate();
            String eqUrl = String.format(
                "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=%f&longitude=%f&maxradiuskm=200&limit=1&orderby=time",
                lat, lon
            );
            Map<String, Object> eqResponse = restTemplate.getForObject(eqUrl, Map.class);

            if (eqResponse != null && eqResponse.get("features") != null) {
                List<Map<String, Object>> features = (List<Map<String, Object>>) eqResponse.get("features");
                if (!features.isEmpty()) {
                    Map<String, Object> feature = features.get(0);
                    Map<String, Object> properties = (Map<String, Object>) feature.get("properties");

                    Map<String, Object> latestEq = new HashMap<>();
                    latestEq.put("title", "Earthquake: Magnitude " + properties.get("mag"));
                    latestEq.put("description", "Location: " + properties.get("place") +
                            ", Time: " + new Date(((Number) properties.get("time")).longValue()).toString());

                    response.put("latestEarthquake", latestEq);
                } else {
                    response.put("latestEarthquake", Map.of(
                            "title", "No recent earthquakes",
                            "description", "No significant seismic activity nearby."
                    ));
                }
            }
        } catch (Exception e) {
            response.put("latestEarthquake", Map.of(
                    "title", "Earthquake Alerts",
                    "description", "Unable to fetch earthquake data"
            ));
        }

        response.put("alerts", alerts);
        response.put("weather", weatherData.toMap());

        return response;
    }

    @GetMapping("/test")
    public Map<String, Object> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "Backend is running");
        response.put("timestamp", new Date().toString());
        response.put("message", "API is working correctly");
        return response;
    }
}