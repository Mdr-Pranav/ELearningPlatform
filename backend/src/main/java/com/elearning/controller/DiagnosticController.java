package com.elearning.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.elearning.repository.UserRepository;

@RestController
public class DiagnosticController {
    
    private static final Logger logger = LoggerFactory.getLogger(DiagnosticController.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/diagnostic")
    public String testGet() {
        logger.info("GET /diagnostic endpoint called");
        return "GET diagnostic endpoint is working";
    }
    
    @PostMapping("/diagnostic")
    public String testPost(@RequestBody String body) {
        logger.info("POST /diagnostic endpoint called with body: {}", body);
        return "POST diagnostic endpoint received: " + body;
    }
    
    @GetMapping("/open")
    public String openEndpoint() {
        return "This endpoint is open to everyone";
    }
    
    @GetMapping("/db-test")
    public String testDatabase() {
        try {
            long userCount = userRepository.count();
            return "Database connection successful! User count: " + userCount;
        } catch (Exception e) {
            logger.error("Database connection test failed", e);
            return "Database connection failed: " + e.getMessage();
        }
    }
} 