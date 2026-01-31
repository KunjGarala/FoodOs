package org.foodos.restaurant.controller;

import lombok.RequiredArgsConstructor;
import org.foodos.common.utils.S3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/test/s3")
@RequiredArgsConstructor
public class S3TestController {

    private final S3Service s3Service;

    /**
     * Upload image to S3
     */
    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "test") String folder
    ) {
        String objectKey = s3Service.uploadImage(file, folder);

        return ResponseEntity.ok().body("Image Uploaded successfully with Object Key: " + objectKey);
    }

    /**
     * Delete image from S3
     */
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteImage(
            @RequestParam("imageUrl") String objectKey
    ) {
        s3Service.deleteImage(objectKey);

        return ResponseEntity.ok()
                .body("Image deleted successfully");
    }
}
