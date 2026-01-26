package org.foodos.common.emails;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.restaurant.entity.Restaurant;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Year;

@Service
@Slf4j
@RequiredArgsConstructor
public class WelcomeEmailService {

    private final EmailService emailService;

    @Async
    public void sendWelcomeEmail(UserAuthEntity user, Restaurant restaurant) {
        try {
            String htmlContent = generateWelcomeEmailHtml(user, restaurant);
            emailService.sendHtmlEmail(
                    user.getEmail(),
                    "Welcome to FoodOs - Your Restaurant Management Account",
                    htmlContent
            );
            log.info("Welcome email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to user: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send welcome email", e);
        }
    }

    private String generateWelcomeEmailHtml(UserAuthEntity user, Restaurant restaurant) {
        String restaurantName = restaurant != null ? restaurant.getName() : "Not Assigned";
        String businessName = restaurant != null && restaurant.getBusinessName() != null ?
                restaurant.getBusinessName() : "";
        String restaurantUuid = restaurant != null ? restaurant.getRestaurantUuid() : "N/A";
        String licenseType = restaurant != null && restaurant.getLicenseType() != null ?
                restaurant.getLicenseType().name() : "N/A";
        String restaurantType = restaurant != null && restaurant.getRestaurantType() != null ?
                restaurant.getRestaurantType().name() : "STANDARD";
        String location = restaurant != null ?
                (restaurant.getCity() != null ? restaurant.getCity() : "") +
                        (restaurant.getState() != null ? ", " + restaurant.getState() : "") : "";
        String contact = restaurant != null ?
                (restaurant.getPhoneNumber() != null ? restaurant.getPhoneNumber() : "N/A") + " • " +
                        (restaurant.getEmail() != null ? restaurant.getEmail() : "N/A") : "";
        String ownerName = restaurant != null && restaurant.getOwnerName() != null ?
                restaurant.getOwnerName() : "N/A";

        boolean hasMultipleRestaurants = user.getRestaurants() != null &&
                !user.getRestaurants().isEmpty() &&
                user.getRestaurants().size() > 1;

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to FoodOs</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .info-box { background-color: white; border: 1px solid #ddd; padding: 15px; margin: 20px 0; }
                    .info-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .info-label { font-weight: bold; color: #666; }
                    .info-value { color: #333; }
                    .restaurant-details { background-color: white; padding: 15px; border: 1px solid #ddd; }
                    .detail-item { margin-bottom: 10px; }
                    .detail-label { font-weight: bold; color: #666; font-size: 12px; }
                    .detail-value { color: #333; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .cta-button { 
                        display: inline-block; 
                        background-color: #ff6b35; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 4px; 
                        margin: 20px 0; 
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>WELCOME TO FOODOS</h1>
                        <div class="subtitle">PREMIUM RESTAURANT MANAGEMENT</div>
                    </div>
                    
                    <div class="content">
                        <p class="welcome-message">Your account has been successfully created</p>
                        
                        <p>Dear <strong>FoodOs Member</strong>,</p>
                        
                        <p>We're delighted to welcome you to FoodOs, where premium restaurant management meets exceptional efficiency. Your account has been created and is ready for use.</p>
                        
                        <div class="info-box">
                            <div class="info-item">
                                <span class="info-label">YOUR USERNAME</span>
                                <span class="info-value">%s</span>
                            </div>
                            
                            <div class="info-item">
                                <span class="info-label">ACCOUNT STATUS</span>
                                <span class="info-value">Active and ready for use</span>
                            </div>
                            
                            <div class="info-item">
                                <span class="info-label">REGISTRATION DATE</span>
                                <span class="info-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="restaurant-section">
                            <div class="restaurant-header">
                                <div class="restaurant-logo">%s</div>
                                <div>
                                    <div class="restaurant-name">%s</div>
                                    <div style="margin-top: 5px; font-size: 14px; color: #666;">
                                        %s
                                    </div>
                                </div>
                            </div>
                            
                            <div class="restaurant-details">
                                <div class="detail-item">
                                    <div class="detail-label">RESTAURANT ID</div>
                                    <div class="detail-value">%s</div>
                                </div>
                                
                                <div class="detail-item">
                                    <div class="detail-label">LICENSE TYPE</div>
                                    <div class="detail-value">
                                        <span>%s License</span>
                                    </div>
                                </div>
                                
                                <div class="detail-item">
                                    <div class="detail-label">RESTAURANT TYPE</div>
                                    <div class="detail-value">
                                        <span>%s</span>
                                    </div>
                                </div>
                                
                                <div class="detail-item">
                                    <div class="detail-label">LOCATION</div>
                                    <div class="detail-value">%s</div>
                                </div>
                                
                                <div class="detail-item">
                                    <div class="detail-label">CONTACT</div>
                                    <div class="detail-value">%s</div>
                                </div>
                                
                                <div class="detail-item">
                                    <div class="detail-label">OWNER</div>
                                    <div class="detail-value">%s</div>
                                </div>
                            </div>
            """.formatted(
                user.getUsername(),
                LocalDate.now(),
                !restaurantName.isEmpty() ? restaurantName.charAt(0) : "R",
                restaurantName,
                businessName,
                restaurantUuid,
                licenseType,
                restaurantType.replace("_", " "),
                location,
                contact,
                ownerName
        ) +
                (hasMultipleRestaurants ? """
                <div class="multi-restaurant-notice" style="background-color: #fff3cd; padding: 10px; margin: 10px 0; border: 1px solid #ffeaa7;">
                    <strong>Note:</strong> You have access to %s restaurants. This information will be available in your account dashboard.
                </div>
            """.formatted(user.getRestaurants().size()) : "") +
                """
                            </div>
                            
                            <div class="password-notice" style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-left: 4px solid #2196F3;">
                                <p><strong>Password Information:</strong> For security purposes, your password will be provided by your Restaurant Management team. Please contact them directly to obtain your login credentials.</p>
                            </div>
                            
                            <p>Once you receive your password, you can access your account to:</p>
                            <ul style="margin-left: 20px; margin-top: 10px; margin-bottom: 25px;">
                                <li style="margin-bottom: 8px;">Manage menu items and categories</li>
                                <li style="margin-bottom: 8px;">Process orders and manage tables</li>
                                <li style="margin-bottom: 8px;">Access detailed sales reports and analytics</li>
                                <li style="margin-bottom: 8px;">Manage inventory and supplier information</li>
                                <li>Configure restaurant settings and preferences</li>
                            </ul>
                            
                            <div style="text-align: center;">
                                <a href="https://foodos.example.com/dashboard" class="cta-button">ACCESS YOUR FOODOS DASHBOARD</a>
                            </div>
                            
                            <div style="border-top: 1px solid #ddd; margin: 30px 0;"></div>
                            
                            <p style="font-size: 14px; color: #666666;">
                                <strong>Need assistance?</strong> Contact our support team or speak with your restaurant administrator for help with your account setup.
                            </p>
                        </div>
                        
                        <div class="footer">
                            <div style="font-size: 24px; font-weight: bold; color: #ff6b35; margin-bottom: 10px;">FOODOS</div>
                            <p>Premium Restaurant Management Platform</p>
                            <div class="contact-info">
                                <p>This email was sent to %s</p>
                                <p>&copy; %s FoodOs. All rights reserved.</p>
                                <p><a href="https://foodos.example.com/unsubscribe" style="color: #666;">Unsubscribe</a> | 
                                   <a href="https://foodos.example.com/privacy" style="color: #666;">Privacy Policy</a> | 
                                   <a href="https://foodos.example.com/terms" style="color: #666;">Terms of Service</a></p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(user.getEmail(), Year.now().getValue());
    }
}
