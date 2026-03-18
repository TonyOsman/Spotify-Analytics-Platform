package com.spotify.coreapi.api;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {
    @GetMapping("/live")
    public Map<String, String> live() {
        return Map.of("status", "UP");
    }

    @GetMapping("/ready")
    public Map<String, String> ready() {
        return Map.of("status", "READY");
    }
}
