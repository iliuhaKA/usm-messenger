package com.usm.messenger.exception;


public class ChatNotFoundException extends RuntimeException {
    
    public ChatNotFoundException(String message) {
        super(message);
    }

    public ChatNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
