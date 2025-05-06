package com.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.elearning.model.Role;
import com.elearning.model.User;
import com.elearning.model.UserType;
import com.elearning.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private UserRepository userRepository;

    public long countStudents() {
        long count = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(Role.ROLE_STUDENT.name()))
                .count();
        System.out.println("Total student count: " + count);
        return count;
    }

    public long countStudentsByType(UserType userType) {
        long count = getUsersByType(userType).size();
        System.out.println("Student count for type " + userType + ": " + count);
        return count;
    }

    public long countStudentTypeUsers() {
        return countStudentsByType(UserType.STUDENT);
    }

    public long countProfessionalTypeUsers() {
        return countStudentsByType(UserType.PROFESSIONAL);
    }

    public long countPlacementTypeUsers() {
        return countStudentsByType(UserType.PLACEMENT_TRAINING);
    }

    private List<User> getUsersByType(UserType userType) {
        List<User> allUsers = userRepository.findAll();
        System.out.println("Total users in database: " + allUsers.size());

        List<User> studentsWithType = allUsers.stream()
                .filter(user -> user.getRoles().contains(Role.ROLE_STUDENT.name()))
                .filter(user -> userType == user.getUserType())
                .collect(Collectors.toList());

        System.out.println("Students with type " + userType + ": " + studentsWithType.size());
        System.out.println("Student userTypes in DB: " +
                allUsers.stream()
                        .filter(user -> user.getRoles().contains(Role.ROLE_STUDENT.name()))
                        .map(user -> user.getUserType())
                        .collect(Collectors.toList()));

        return studentsWithType;
    }
}