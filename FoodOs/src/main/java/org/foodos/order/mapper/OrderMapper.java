package org.foodos.order.mapper;

import org.foodos.order.dto.request.*;
import org.foodos.order.dto.response.*;
import org.foodos.order.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

/**
 * Order Mapper using MapStruct
 * Maps between entities and DTOs
 */
@Mapper(componentModel = "spring")
public interface OrderMapper {

    // ===== ORDER MAPPING =====

    @Mapping(target = "restaurantUuid", source = "restaurant.restaurantUuid")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    @Mapping(target = "tableNumber", source = "table.tableNumber")
    @Mapping(target = "waiterName", source = "waiter.username")
    @Mapping(target = "items", source = "items")
    @Mapping(target = "payments", source = "payments")
    @Mapping(target = "kotSent", expression = "java(order.hasKotSent())")
    @Mapping(target = "kotCount", expression = "java(order.getKitchenOrderTickets() != null ? order.getKitchenOrderTickets().size() : 0)")
    @Mapping(target = "cancelledBy", source = "cancelledBy.username")
    @Mapping(target = "couponUuid", source = "coupon.couponUuid")
    @Mapping(target = "couponName", source = "coupon.name")
    @Mapping(target = "couponDiscountValue", source = "coupon.discountValue")
    @Mapping(target = "couponDiscountType", expression = "java(order.getCoupon() != null ? order.getCoupon().getDiscountType().name() : null)")
    @Mapping(target = "couponMaxDiscountAmount", source = "coupon.maxDiscountAmount")
    OrderResponse toOrderResponse(Order order);

    List<OrderResponse> toOrderResponseList(List<Order> orders);

    // ===== ORDER ITEM MAPPING =====

    @Mapping(target = "productUuid", source = "product.productUuid")
    @Mapping(target = "modifiers", source = "modifiers")
    OrderItemResponse toOrderItemResponse(OrderItem item);

    List<OrderItemResponse> toOrderItemResponseList(List<OrderItem> items);

    // ===== ORDER ITEM MODIFIER MAPPING =====

    @Mapping(target = "modifierUuid", source = "modifier.modifierUuid")
    OrderItemModifierResponse toOrderItemModifierResponse(OrderItemModifier modifier);

    List<OrderItemModifierResponse> toOrderItemModifierResponseList(List<OrderItemModifier> modifiers);

    // ===== PAYMENT MAPPING =====

    @Mapping(target = "collectedBy", source = "collectedBy.username")
    PaymentResponse toPaymentResponse(Payment payment);

    List<PaymentResponse> toPaymentResponseList(List<Payment> payments);

    // ===== KOT MAPPING =====

    @Mapping(target = "kotItems", source = "kotItems")
    KotResponse toKotResponse(KitchenOrderTicket kot);

    List<KotResponse> toKotResponseList(List<KitchenOrderTicket> kots);

    // ===== KOT ITEM MAPPING =====

    KotItemResponse toKotItemResponse(KotItem item);

    List<KotItemResponse> toKotItemResponseList(List<KotItem> items);

    // ===== REQUEST TO ENTITY MAPPING =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orderUuid", ignore = true)
    @Mapping(target = "orderNumber", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "table", ignore = true)
    @Mapping(target = "waiter", ignore = true)
    @Mapping(target = "cashier", ignore = true)
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "kitchenOrderTickets", ignore = true)
    @Mapping(target = "payments", ignore = true)
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "deliveryCharge", expression = "java(request.getDeliveryCharge() != null ? request.getDeliveryCharge() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "packingCharge", expression = "java(request.getPackingCharge() != null ? request.getPackingCharge() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "discountPercentage", expression = "java(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "taxPercentage", expression = "java(request.getTaxPercentage() != null ? request.getTaxPercentage() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "serviceChargePercentage", expression = "java(request.getServiceChargePercentage() != null ? request.getServiceChargePercentage() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "orderDate", ignore = true)
    @Mapping(target = "orderTime", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "taxAmount", ignore = true)
    @Mapping(target = "serviceCharge", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "paidAmount", ignore = true)
    @Mapping(target = "balanceAmount", ignore = true)
    @Mapping(target = "tipAmount", ignore = true)
    @Mapping(target = "roundOff", ignore = true)
    @Mapping(target = "discountApprovedBy", ignore = true)
    @Mapping(target = "billedAt", ignore = true)
    @Mapping(target = "paidAt", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    @Mapping(target = "cancelledAt", ignore = true)
    @Mapping(target = "cancelledBy", ignore = true)
    @Mapping(target = "cancellationReason", ignore = true)
    @Mapping(target = "isSynced", ignore = true)
    @Mapping(target = "syncedAt", ignore = true)
    @Mapping(target = "isPrinted", ignore = true)
    @Mapping(target = "printedAt", ignore = true)
    Order toOrder(CreateOrderRequest request);

    // ===== ORDER ITEM REQUEST TO ENTITY MAPPING =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orderItemUuid", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "variation", ignore = true)
    @Mapping(target = "kitchenOrderTicket", ignore = true)
    @Mapping(target = "modifiers", ignore = true)
    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "variationName", ignore = true)
    @Mapping(target = "sku", ignore = true)
    @Mapping(target = "unitPrice", ignore = true)
    @Mapping(target = "costPrice", ignore = true)
    @Mapping(target = "discountPercentage", expression = "java(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "discountAmount", expression = "java(request.getDiscountAmount() != null ? request.getDiscountAmount() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "taxAmount", ignore = true)
    @Mapping(target = "taxPercentage", ignore = true)
    @Mapping(target = "lineTotal", ignore = true)
    @Mapping(target = "kotStatus", constant = "PENDING")
    @Mapping(target = "isComplimentary", expression = "java(request.getIsComplimentary() != null ? request.getIsComplimentary() : false)")
    @Mapping(target = "isHalfPortion", expression = "java(request.getIsHalfPortion() != null ? request.getIsHalfPortion() : false)")
    @Mapping(target = "isCancelled", ignore = true)
    @Mapping(target = "cancelledAt", ignore = true)
    @Mapping(target = "cancelledBy", ignore = true)
    @Mapping(target = "cancellationReason", ignore = true)
    @Mapping(target = "kotPrintedAt", ignore = true)
    @Mapping(target = "preparationStartedAt", ignore = true)
    @Mapping(target = "readyAt", ignore = true)
    @Mapping(target = "servedAt", ignore = true)
    @Mapping(target = "servedBy", ignore = true)
    @Mapping(target = "specialInstructions", ignore = true)
    @Mapping(target = "spicyLevel", source = "request.spicyLevel")
    @Mapping(target = "kitchenNotes", source = "request.kitchenNotes")
    @Mapping(target = "orderNotes", source = "request.orderNotes")
    @Mapping(target = "sortOrder", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    OrderItem toOrderItem(OrderItemRequest request);

    // ===== ORDER ITEM MODIFIER REQUEST TO ENTITY MAPPING =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orderItemModifierUuid", ignore = true)
    @Mapping(target = "orderItem", ignore = true)
    @Mapping(target = "modifier", ignore = true)
    @Mapping(target = "modifierName", ignore = true)
    @Mapping(target = "modifierGroupName", ignore = true)
    @Mapping(target = "quantity", ignore = true)
    @Mapping(target = "unitPrice", ignore = true)
    @Mapping(target = "lineTotal", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    OrderItemModifier toOrderItemModifier(OrderItemModifierRequest request);

    // ===== PAYMENT REQUEST TO ENTITY MAPPING =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "paymentUuid", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "collectedBy", ignore = true)
    @Mapping(target = "paymentDate", ignore = true)
    @Mapping(target = "status", constant = "COMPLETED")
    @Mapping(target = "isRefunded", ignore = true)
    @Mapping(target = "refundAmount", ignore = true)
    @Mapping(target = "refundDate", ignore = true)
    @Mapping(target = "refundReason", ignore = true)
    @Mapping(target = "refundedBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Payment toPayment(AddPaymentRequest request);

    // ===== KOT REQUEST TO ENTITY MAPPING =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "kotUuid", ignore = true)
    @Mapping(target = "restaurant", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "kotItems", ignore = true)
    @Mapping(target = "kotNumber", ignore = true)
    @Mapping(target = "kotDate", ignore = true)
    @Mapping(target = "kotTime", ignore = true)
    @Mapping(target = "kotType", constant = "NEW")
    @Mapping(target = "status", constant = "PENDING")
    @Mapping(target = "orderNumber", ignore = true)
    @Mapping(target = "tableNumber", ignore = true)
    @Mapping(target = "waiterName", ignore = true)
    @Mapping(target = "spicyLevel", source = "request.spicyLevel")
    @Mapping(target = "totalQuantity", source = "request.totalQuantity")
    @Mapping(target = "kitchenNotes", source = "request.kitchenNotes")
    @Mapping(target = "orderNotes", source = "request.orderNotes")
    @Mapping(target = "isUrgent", expression = "java(request.getIsUrgent() != null ? request.getIsUrgent() : false)")
    @Mapping(target = "priority", expression = "java(request.getPriority() != null ? request.getPriority() : 0)")
    @Mapping(target = "notes", ignore = true)
    @Mapping(target = "printedAt", ignore = true)
    @Mapping(target = "acknowledgedAt", ignore = true)
    @Mapping(target = "preparationStartedAt", ignore = true)
    @Mapping(target = "readyAt", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    @Mapping(target = "cancelledAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    KitchenOrderTicket toKitchenOrderTicket(SendKotRequest request);

    // ===== ORDER ITEM TO KOT ITEM MAPPING =====

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "kotItemUuid", ignore = true)
    @Mapping(target = "kitchenOrderTicket", ignore = true)
    @Mapping(target = "orderItem", source = "orderItem")
    @Mapping(target = "productName", source = "orderItem.productName")
    @Mapping(target = "variationName", source = "orderItem.variationName")
    @Mapping(target = "quantity", source = "orderItem.quantity")
    @Mapping(target = "modifiersText", source = "orderItem.modifiersText")
    @Mapping(target = "notes", source = "orderItem.itemNotes")
    @Mapping(target = "specialInstructions", source = "orderItem.specialInstructions")
    @Mapping(target = "spicyLevel", source = "orderItem.spicyLevel")
    @Mapping(target = "kitchenNotes", source = "orderItem.kitchenNotes")
    @Mapping(target = "orderNotes", source = "orderItem.orderNotes")
    @Mapping(target = "isComplimentary", source = "orderItem.isComplimentary")
    @Mapping(target = "isCancelled", ignore = true)
    @Mapping(target = "isReady", ignore = true)
    @Mapping(target = "sortOrder", ignore = true)
    @Mapping(target = "isHighlighted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "readyAt", ignore = true)
    KotItem toKotItem(OrderItem orderItem);
}

