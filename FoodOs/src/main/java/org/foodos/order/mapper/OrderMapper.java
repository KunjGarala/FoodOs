package org.foodos.order.mapper;

import org.foodos.order.dto.response.*;
import org.foodos.order.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Order Mapper
 * Maps between entities and DTOs
 */
@Component
public class OrderMapper {

    // ===== ORDER MAPPING =====

    public OrderResponse toOrderResponse(Order order) {
        if (order == null) {
            return null;
        }

        return OrderResponse.builder()
                .orderUuid(order.getOrderUuid())
                .orderNumber(order.getOrderNumber())
                .restaurantId(order.getRestaurant() != null ? order.getRestaurant().getId() : null)
                .restaurantName(order.getRestaurant() != null ? order.getRestaurant().getName() : null)
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .waiterName(order.getWaiter() != null ? order.getWaiter().getUsername() : null)
                .orderDate(order.getOrderDate())
                .orderTime(order.getOrderTime())
                .orderType(order.getOrderType())
                .numberOfGuests(order.getNumberOfGuests())
                .status(order.getStatus())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .customerEmail(order.getCustomerEmail())
                .deliveryAddress(order.getDeliveryAddress())
                .items(toOrderItemResponseList(order.getItems()))
                .itemCount(order.getItemCount())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .discountPercentage(order.getDiscountPercentage())
                .taxAmount(order.getTaxAmount())
                .taxPercentage(order.getTaxPercentage())
                .serviceCharge(order.getServiceCharge())
                .serviceChargePercentage(order.getServiceChargePercentage())
                .deliveryCharge(order.getDeliveryCharge())
                .packingCharge(order.getPackingCharge())
                .tipAmount(order.getTipAmount())
                .roundOff(order.getRoundOff())
                .totalAmount(order.getTotalAmount())
                .paidAmount(order.getPaidAmount())
                .balanceAmount(order.getBalanceAmount())
                .payments(toPaymentResponseList(order.getPayments()))
                .kotSent(order.hasKotSent())
                .kotCount(order.getKitchenOrderTickets() != null ? order.getKitchenOrderTickets().size() : 0)
                .orderNotes(order.getOrderNotes())
                .kitchenNotes(order.getKitchenNotes())
                .discountReason(order.getDiscountReason())
                .couponCode(order.getCouponCode())
                .cancellationReason(order.getCancellationReason())
                .cancelledAt(order.getCancelledAt())
                .cancelledBy(order.getCancelledBy() != null ? order.getCancelledBy().getUsername() : null)
                .billedAt(order.getBilledAt())
                .paidAt(order.getPaidAt())
                .completedAt(order.getCompletedAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public List<OrderResponse> toOrderResponseList(List<Order> orders) {
        if (orders == null) {
            return List.of();
        }
        return orders.stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    // ===== ORDER ITEM MAPPING =====

    public OrderItemResponse toOrderItemResponse(OrderItem item) {
        if (item == null) {
            return null;
        }

        return OrderItemResponse.builder()
                .orderItemUuid(item.getOrderItemUuid())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .variationName(item.getVariationName())
                .sku(item.getSku())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountAmount(item.getDiscountAmount())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .modifiers(toOrderItemModifierResponseList(item.getModifiers()))
                .modifiersText(item.getModifiersText())
                .itemNotes(item.getItemNotes())
                .specialInstructions(item.getSpecialInstructions())
                .kotStatus(item.getKotStatus())
                .isCancelled(item.getIsCancelled())
                .isComplimentary(item.getIsComplimentary())
                .isHalfPortion(item.getIsHalfPortion())
                .cancellationReason(item.getCancellationReason())
                .cancelledAt(item.getCancelledAt())
                .kotPrintedAt(item.getKotPrintedAt())
                .readyAt(item.getReadyAt())
                .servedAt(item.getServedAt())
                .createdAt(item.getCreatedAt())
                .build();
    }

    public List<OrderItemResponse> toOrderItemResponseList(List<OrderItem> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream()
                .map(this::toOrderItemResponse)
                .collect(Collectors.toList());
    }

    // ===== ORDER ITEM MODIFIER MAPPING =====

    public OrderItemModifierResponse toOrderItemModifierResponse(OrderItemModifier modifier) {
        if (modifier == null) {
            return null;
        }

        return OrderItemModifierResponse.builder()
                .orderItemModifierUuid(modifier.getOrderItemModifierUuid())
                .modifierId(modifier.getModifier() != null ? modifier.getModifier().getId() : null)
                .modifierName(modifier.getModifierName())
                .modifierGroupName(modifier.getModifierGroupName())
                .quantity(modifier.getQuantity())
                .unitPrice(modifier.getUnitPrice())
                .lineTotal(modifier.getLineTotal())
                .build();
    }

    public List<OrderItemModifierResponse> toOrderItemModifierResponseList(List<OrderItemModifier> modifiers) {
        if (modifiers == null) {
            return List.of();
        }
        return modifiers.stream()
                .map(this::toOrderItemModifierResponse)
                .collect(Collectors.toList());
    }

    // ===== PAYMENT MAPPING =====

    public PaymentResponse toPaymentResponse(Payment payment) {
        if (payment == null) {
            return null;
        }

        return PaymentResponse.builder()
                .paymentUuid(payment.getPaymentUuid())
                .paymentMethod(payment.getPaymentMethod())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .transactionId(payment.getTransactionId())
                .referenceNumber(payment.getReferenceNumber())
                .cardLastFour(payment.getCardLastFour())
                .cardType(payment.getCardType())
                .upiId(payment.getUpiId())
                .bankName(payment.getBankName())
                .notes(payment.getNotes())
                .collectedBy(payment.getCollectedBy() != null ? payment.getCollectedBy().getUsername() : null)
                .isRefunded(payment.getIsRefunded())
                .refundAmount(payment.getRefundAmount())
                .netAmount(payment.getNetAmount())
                .paymentDate(payment.getPaymentDate())
                .refundDate(payment.getRefundDate())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    public List<PaymentResponse> toPaymentResponseList(List<Payment> payments) {
        if (payments == null) {
            return List.of();
        }
        return payments.stream()
                .map(this::toPaymentResponse)
                .collect(Collectors.toList());
    }

    // ===== KOT MAPPING =====

    public KotResponse toKotResponse(KitchenOrderTicket kot) {
        if (kot == null) {
            return null;
        }

        return KotResponse.builder()
                .kotUuid(kot.getKotUuid())
                .kotNumber(kot.getKotNumber())
                .orderNumber(kot.getOrderNumber())
                .tableNumber(kot.getTableNumber())
                .waiterName(kot.getWaiterName())
                .kotDate(kot.getKotDate())
                .kotTime(kot.getKotTime())
                .kotType(kot.getKotType())
                .status(kot.getStatus())
                .printerTarget(kot.getPrinterTarget())
                .kitchenStation(kot.getKitchenStation())
                .kotItems(toKotItemResponseList(kot.getKotItems()))
                .totalItemsCount(kot.getTotalItemsCount())
                .notes(kot.getNotes())
                .specialInstructions(kot.getSpecialInstructions())
                .isUrgent(kot.getIsUrgent())
                .priority(kot.getPriority())
                .printedAt(kot.getPrintedAt())
                .acknowledgedAt(kot.getAcknowledgedAt())
                .preparationStartedAt(kot.getPreparationStartedAt())
                .readyAt(kot.getReadyAt())
                .completedAt(kot.getCompletedAt())
                .createdAt(kot.getCreatedAt())
                .build();
    }

    public List<KotResponse> toKotResponseList(List<KitchenOrderTicket> kots) {
        if (kots == null) {
            return List.of();
        }
        return kots.stream()
                .map(this::toKotResponse)
                .collect(Collectors.toList());
    }

    // ===== KOT ITEM MAPPING =====

    public KotItemResponse toKotItemResponse(KotItem item) {
        if (item == null) {
            return null;
        }

        return KotItemResponse.builder()
                .kotItemUuid(item.getKotItemUuid())
                .productName(item.getProductName())
                .variationName(item.getVariationName())
                .quantity(item.getQuantity())
                .modifiersText(item.getModifiersText())
                .notes(item.getNotes())
                .specialInstructions(item.getSpecialInstructions())
                .isCancelled(item.getIsCancelled())
                .isReady(item.getIsReady())
                .isComplimentary(item.getIsComplimentary())
                .isHighlighted(item.getIsHighlighted())
                .sortOrder(item.getSortOrder())
                .build();
    }

    public List<KotItemResponse> toKotItemResponseList(List<KotItem> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream()
                .map(this::toKotItemResponse)
                .collect(Collectors.toList());
    }
}

