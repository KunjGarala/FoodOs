package org.foodos.order.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.foodos.auth.entity.UserAuthEntity;
import org.foodos.common.entity.BaseSoftDeleteEntity;
import org.foodos.order.entity.enums.PaymentMethod;
import org.foodos.order.entity.enums.PaymentStatus;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payment Entity
 * Tracks payments made against orders
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_uuid", columnList = "payment_uuid"),
        @Index(name = "idx_payment_order_id", columnList = "order_id"),
        @Index(name = "idx_payment_date", columnList = "payment_date"),
        @Index(name = "idx_payment_method", columnList = "payment_method"),
        @Index(name = "idx_payment_status", columnList = "status"),
        @Index(name = "idx_payment_transaction_id", columnList = "transaction_id")
})
@SQLDelete(sql = "UPDATE payments SET is_deleted = true, deleted_at = now() WHERE id = ? AND version = ?")
@SQLRestriction("is_deleted = false")
@Filter(name = "deletedFilter", condition = "is_deleted = :isDeleted")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Payment extends BaseSoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_uuid", unique = true, nullable = false, updatable = false, length = 36)
    @Builder.Default
    private String paymentUuid = UUID.randomUUID().toString();

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    // ===== RELATIONSHIPS =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by")
    private UserAuthEntity collectedBy;

    // ===== PAYMENT DETAILS =====

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    // ===== TRANSACTION DETAILS =====

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "card_last_four", length = 4)
    private String cardLastFour;

    @Column(name = "card_type", length = 20)
    private String cardType;

    @Column(name = "upi_id", length = 100)
    private String upiId;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    // ===== NOTES =====

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ===== REFUND DETAILS =====

    @Column(name = "is_refunded", nullable = false)
    @Builder.Default
    private Boolean isRefunded = false;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refunded_by")
    private UserAuthEntity refundedBy;

    // ===== LIFECYCLE CALLBACKS =====

    @PrePersist
    protected void onCreate() {
        if (paymentUuid == null) {
            paymentUuid = UUID.randomUUID().toString();
        }
        if (paymentDate == null) {
            paymentDate = LocalDateTime.now();
        }
        super.onCreate();
    }

    // ===== BUSINESS LOGIC =====

    /**
     * Mark payment as completed
     */
    public void markAsCompleted(String transactionId) {
        this.status = PaymentStatus.COMPLETED;
        this.transactionId = transactionId;
    }

    /**
     * Mark payment as failed
     */
    public void markAsFailed() {
        this.status = PaymentStatus.FAILED;
    }

    /**
     * Process refund
     */
    public void processRefund(BigDecimal refundAmount, String reason, UserAuthEntity refundedBy) {
        if (this.status != PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Can only refund completed payments");
        }

        if (refundAmount.compareTo(this.amount) > 0) {
            throw new IllegalArgumentException("Refund amount cannot exceed payment amount");
        }

        this.refundAmount = refundAmount;
        this.refundDate = LocalDateTime.now();
        this.refundReason = reason;
        this.refundedBy = refundedBy;
        this.isRefunded = true;

        if (refundAmount.compareTo(this.amount) == 0) {
            this.status = PaymentStatus.REFUNDED;
        } else {
            this.status = PaymentStatus.PARTIALLY_REFUNDED;
        }
    }

    /**
     * Get net amount after refund
     */
    public BigDecimal getNetAmount() {
        if (refundAmount != null) {
            return amount.subtract(refundAmount);
        }
        return amount;
    }
}
