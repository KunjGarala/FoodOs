package org.foodos.order.entity.enums;

/**
 * Payment methods supported
 */
public enum PaymentMethod {
    CASH("Cash", "Cash payment"),
    CARD("Card", "Credit/Debit card"),
    UPI("UPI", "UPI payment"),
    WALLET("Wallet", "Digital wallet"),
    CREDIT("Credit", "Credit account"),
    BANK_TRANSFER("Bank Transfer", "Bank transfer"),
    CHEQUE("Cheque", "Cheque payment"),
    ONLINE("Online", "Online payment gateway");

    private final String displayName;
    private final String description;

    PaymentMethod(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}

