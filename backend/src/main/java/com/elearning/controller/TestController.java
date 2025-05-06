package com.elearning.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello World!";
    }
    
    @PostMapping("/test-post")
    public String testPost(@RequestBody String requestBody) {
        return "Received: " + requestBody;
    }
} 