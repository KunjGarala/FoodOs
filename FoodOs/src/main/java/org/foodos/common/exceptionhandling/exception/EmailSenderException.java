package org.foodos.common.exceptionhandling.exception;

public class EmailSenderException extends RuntimeException {
    public EmailSenderException(String message) {
        super(message);
    }
}
