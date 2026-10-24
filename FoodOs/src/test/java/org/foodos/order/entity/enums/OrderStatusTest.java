package org.foodos.order.entity.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderStatusTest {

    @Test
    void billCanBeGeneratedFromEveryBillableOrderState() {
        assertTrue(OrderStatus.OPEN.canTransitionTo(OrderStatus.BILLED));
        assertTrue(OrderStatus.KOT_SENT.canTransitionTo(OrderStatus.BILLED));
        assertTrue(OrderStatus.IN_PROGRESS.canTransitionTo(OrderStatus.BILLED));
        assertTrue(OrderStatus.READY.canTransitionTo(OrderStatus.BILLED));
        assertTrue(OrderStatus.SERVED.canTransitionTo(OrderStatus.BILLED));
    }
}