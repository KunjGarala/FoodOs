package org.foodos.common;

import org.foodos.common.utils_temp.S3Service;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AwsS3Testing {

    @Autowired
    private S3Service s3Service;

    @Test
    void uploadImage_shouldUploadSuccessfully() {

        MultipartFile file = new MockMultipartFile(
                "file",
                "test-image.png",
                "image/png",
                "dummy image content".getBytes()
        );

        String objectKey = s3Service.uploadImage(file, "test");

        assertThat(objectKey).isNotNull();
        assertThat(objectKey).contains("test/");
    }

    @Test
    void deleteImage_shouldDeleteSuccessfully() {

        MultipartFile file = new MockMultipartFile(
                "file",
                "delete-test.png",
                "image/png",
                "delete image content".getBytes()
        );

        String objectKey = s3Service.uploadImage(file, "test");

        s3Service.deleteImage(objectKey);

        // No exception = success
        assertThat(objectKey).isNotBlank();
    }
}
