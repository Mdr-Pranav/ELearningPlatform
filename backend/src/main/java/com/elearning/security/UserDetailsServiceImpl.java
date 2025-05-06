package com.elearning.security;

import com.elearning.model.User;
import com.elearning.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("Loading user details for username: " + username);
        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        System.err.println("User not found in database: " + username);
                        return new UsernameNotFoundException("User Not Found with username: " + username);
                    });

            System.out.println("User found, building UserDetails");
            UserDetails userDetails = UserDetailsImpl.build(user);
            System.out.println("UserDetails built successfully");
            return userDetails;
        } catch (Exception e) {
            System.err.println("Error loading user: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
} 