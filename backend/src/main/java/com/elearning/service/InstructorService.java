package com.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.elearning.model.Role;
import com.elearning.repository.UserRepository;

@Service
public class InstructorService {

    @Autowired
    private UserRepository userRepository;

    public long countInstructors() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(Role.ROLE_INSTRUCTOR.name()))
                .count();
    }
}