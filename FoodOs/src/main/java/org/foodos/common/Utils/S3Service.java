package org.foodos.common.Utils;

import lombok.RequiredArgsConstructor;
import org.foodos.common.exceptionhandling.exception.FileIsNotImageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.region}")
    private Region region;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "image/webp"
    );


    public String uploadImage(MultipartFile file, String folder) {

        validateImage(file);

        String objectKey = buildObjectKey(folder, file.getOriginalFilename());

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(file.getContentType())
                .build();

        try {
            s3Client.putObject(
                    request,
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image to S3", e);
        }

        return getPublicUrl(objectKey);
    }


    public void deleteImage(String encS3Url) {

        try {
            // 1️⃣ Decode request param once
            String decodedUrl = URLDecoder.decode(
                    encS3Url,
                    StandardCharsets.UTF_8
            );

            // 2️⃣ Expected prefix
            String prefix = "https://" + bucketName + ".s3." + region.id() + ".amazonaws.com/";

            if (!decodedUrl.startsWith(prefix)) {
                throw new IllegalArgumentException("URL does not belong to this S3 bucket");
            }

            // 3️⃣ Extract object key safely
            String objectKey = decodedUrl.substring(prefix.length());

            // ❌ DO NOT decode again

            // 4️⃣ Delete object
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            s3Client.deleteObject(deleteRequest);

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid S3 URL: " + encS3Url, e);
        }
    }


    /* ================= PRIVATE HELPERS ================= */

    private void validateImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }

        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new FileIsNotImageException("Only image files are allowed");
        }
    }

    private String buildObjectKey(String folder, String originalFileName) {
        return folder + "/" + UUID.randomUUID() + "-" + originalFileName;
    }

    private String getPublicUrl(String key) {
        return String.format(
                "https://%s.s3.%s.amazonaws.com/%s",
                bucketName,
                region.id(),
                URLEncoder.encode(key, StandardCharsets.UTF_8)
                        .replace("+", "%20")
        );
    }
}
