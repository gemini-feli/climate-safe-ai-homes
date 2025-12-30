package com.climatesafe.backend.service;

import com.climatesafe.backend.config.WeatherConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.json.JSONObject;

@Service
public class WeatherService {

    @Autowired
    private WeatherConfig config;

    private static final String WEATHER_URL =
            "https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={apiKey}&units=metric";

    public JSONObject getWeather(double lat, double lon) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(
                    WEATHER_URL,
                    String.class,
                    lat,
                    lon,
                    config.getApiKey()
            );

            if (response == null) {
                return new JSONObject().put("error", "No response from weather API.");
            }

            JSONObject json = new JSONObject(response);

            if (json.has("cod") && json.getInt("cod") != 200) {
                String errorMessage = json.optString("message", "Unknown API error");
                return new JSONObject().put("error", "Weather API error: " + errorMessage);
            }

            String city = json.optString("name", "Unknown");
            String description = json.getJSONArray("weather")
                                     .getJSONObject(0)
                                     .optString("description", "N/A");
            double temp = json.getJSONObject("main").optDouble("temp", 0.0);
            int humidity = json.getJSONObject("main").optInt("humidity", 0);
            double windSpeed = json.getJSONObject("wind").optDouble("speed", 0.0);

            double rainfall = 0.0;
            if (json.has("rain")) {
                JSONObject rainObj = json.getJSONObject("rain");
                if (rainObj.has("1h")) rainfall = rainObj.optDouble("1h", 0.0);
                else if (rainObj.has("3h")) rainfall = rainObj.optDouble("3h", 0.0);
            }

            JSONObject result = new JSONObject();
            result.put("city", city);
            result.put("latitude", lat);
            result.put("longitude", lon);
            result.put("temperature", temp);
            result.put("description", description);
            result.put("humidity", humidity);
            result.put("windSpeed", windSpeed);
            result.put("rainfall", rainfall);

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return new JSONObject().put("error", "Error fetching weather: " + e.getMessage());
        }
    }
}