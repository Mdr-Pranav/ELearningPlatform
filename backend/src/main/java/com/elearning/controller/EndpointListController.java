package com.elearning.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class EndpointListController {

    @Autowired
    private ApplicationContext applicationContext;

    @GetMapping("/endpoints")
    public Map<String, String> getEndpoints() {
        RequestMappingHandlerMapping mapping = applicationContext.getBean(RequestMappingHandlerMapping.class);
        Map<RequestMappingInfo, HandlerMethod> handlerMethods = mapping.getHandlerMethods();
        
        Map<String, String> result = new HashMap<>();
        handlerMethods.forEach((key, value) -> {
            result.put(
                key.toString(), 
                value.getBeanType().getSimpleName() + "." + value.getMethod().getName()
            );
        });
        
        return result;
    }
} 