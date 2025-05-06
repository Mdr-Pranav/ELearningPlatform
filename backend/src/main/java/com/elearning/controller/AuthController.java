package com.elearning.controller;

import com.elearning.dto.JwtResponse;
import com.elearning.dto.LoginRequest;
import com.elearning.dto.MessageResponse;
import com.elearning.dto.SignupRequest;
import com.elearning.model.Role;
import com.elearning.model.User;
import com.elearning.model.UserType;
import com.elearning.repository.UserRepository;
import com.elearning.security.JwtUtils;
import com.elearning.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.validation.Valid;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@Service
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("Login attempt for username: " + loginRequest.getUsername());

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            System.out.println("Authentication successful, generating token");

            String jwt = jwtUtils.generateJwtToken(authentication);
            System.out.println("Token generated successfully");

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            System.out.println("Returning JWT response");
            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roles));
        } catch (Exception e) {
            System.err.println("ERROR during authentication: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        System.out.println("Received signup request with roles: " + signUpRequest.getRoles());

        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFullName(signUpRequest.getFullName());
        user.setPhoneNumber(signUpRequest.getPhoneNumber());

        Set<String> strRoles = signUpRequest.getRoles();
        Set<String> roles = new HashSet<>();

        System.out.println("Processing roles: " + strRoles);

        if (strRoles == null || strRoles.isEmpty()) {
            roles.add(Role.ROLE_STUDENT.name());
            System.out.println("No roles provided, defaulting to ROLE_STUDENT");
        } else {
            strRoles.forEach(role -> {
                System.out.println("Processing role: " + role);
                switch (role.toLowerCase()) {
                    case "admin":
                        roles.add(Role.ROLE_ADMIN.name());
                        System.out.println("Added ROLE_ADMIN");
                        break;
                    case "instructor":
                        roles.add(Role.ROLE_INSTRUCTOR.name());
                        System.out.println("Added ROLE_INSTRUCTOR");
                        break;
                    case "student":
                    default:
                        roles.add(Role.ROLE_STUDENT.name());
                        System.out.println("Added ROLE_STUDENT");
                }
            });
        }

        user.setRoles(roles);
        System.out.println("Final roles set for user: " + roles);

        // Set user type
        if (signUpRequest.getUserType() != null) {
            user.setUserType(signUpRequest.getUserType());
        } else {
            // Default to STUDENT if no user type is specified
            user.setUserType(UserType.STUDENT);
        }

        User savedUser = userRepository.save(user);
        System.out.println("User saved with ID: " + savedUser.getId() + " and roles: " + savedUser.getRoles());

        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/direct-test")
    public String directTest() {
        return "Direct test endpoint works!";
    }

    @GetMapping("/debug/user-info")
    public ResponseEntity<?> getUserInfo(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("User not authenticated"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("username", userDetails.getUsername());
        response.put("authorities", userDetails.getAuthorities());
        
        return ResponseEntity.ok(response);
    }
}