package org.foodos.common.exceptionhandling.exception;

public class FileIsNotImageException extends RuntimeException {
    public FileIsNotImageException(String s) {
        super(s);
    }
}
