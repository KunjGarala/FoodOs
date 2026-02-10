# 🎨 Order Management System - Visual Architecture

## System Overview Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                         │
│  (Web App, Mobile App, POS Terminal, Kitchen Display System)      │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                   │
└────────────────────────────┬───────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼─────────┐ ┌───────▼─────────┐ ┌───────▼─────────┐
│   Order API     │ │   Kitchen API   │ │  Payment API    │
│  (Controller)   │ │  (Controller)   │ │  (Controller)   │
└───────┬─────────┘ └───────┬─────────┘ └───────┬─────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                         SERVICE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │Order Service │  │  KOT Service │  │Payment Service│            │
│  │  (Business   │  │  (Kitchen    │  │  (Payment    │            │
│  │   Logic)     │  │   Logic)     │  │   Logic)     │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────────────┐
│                      REPOSITORY LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │    Order     │  │     KOT      │  │   Payment    │            │
│  │  Repository  │  │  Repository  │  │  Repository  │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼────────────────────┐
│                     DATABASE (PostgreSQL)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  orders  │  │order_items│  │   kots   │  │ payments │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└────────────────────────────────────────────────────────────────────┘
```

---

## Order Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           RESTAURANT                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id, name, address, phone, settings                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │ 1:N
    ┌────────────┼────────────┬─────────────┬──────────────┐
    │            │            │             │              │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│ TABLE │   │ USER  │   │PRODUCT│    │ ORDER │    │  KOT  │
└───┬───┘   └───┬───┘   └───┬───┘    └───┬───┘    └───┬───┘
    │           │           │             │             │
    │           │           │             │             │
    │           │           │     ┌───────┴────────┐    │
    │           │           │     │                 │    │
    │           │           │  ┌──▼──────────┐  ┌──▼────▼──┐
    │           │           │  │ ORDER_ITEM  │  │KOT_ITEM │
    │           │           │  └──┬──────────┘  └─────────┘
    │           │           │     │
    │           │           └─────┤
    │           │                 │
    │           │            ┌────▼────────┐
    │           │            │  MODIFIER   │
    │           │            └─────────────┘
    │           │
    └───────────┼────────────────────┐
                │                    │
           ┌────▼────────┐     ┌────▼────────┐
           │   PAYMENT   │     │  FEEDBACK   │
           └─────────────┘     └─────────────┘
```

---

## Order Lifecycle State Machine

```
┌─────────┐
│  DRAFT  │ ◄──────── New order being created
└────┬────┘
     │ confirmOrder()
     ▼
┌─────────┐
│  OPEN   │ ◄──────── Order confirmed, items can be added
└────┬────┘
     │ sendKot()
     ▼
┌──────────┐
│ KOT_SENT │ ◄──────── Kitchen order ticket sent
└────┬─────┘
     │ kitchenStart()
     ▼
┌─────────────┐
│ IN_PROGRESS │ ◄──────── Kitchen preparing items
└──────┬──────┘
       │ markReady()
       ▼
┌──────────┐
│  READY   │ ◄──────── Items ready for serving
└────┬─────┘
     │ serve()
     ▼
┌──────────┐
│  SERVED  │ ◄──────── Items served to customer
└────┬─────┘
     │ generateBill()
     ▼
┌──────────┐
│  BILLED  │ ◄──────── Bill generated
└────┬─────┘
     │ addPayment()
     ▼
┌──────────┐
│   PAID   │ ◄──────── Payment received
└────┬─────┘
     │ complete()
     ▼
┌──────────┐
│COMPLETED │ ◄──────── Order successfully completed
└──────────┘

     ┌──────────────┐
     │  CANCELLED   │ ◄──── Can cancel at any non-terminal stage
     └──────────────┘

     ┌──────────────┐
     │     VOID     │ ◄──── Order voided (special case)
     └──────────────┘
```

---

## Order Calculation Flow

```
┌────────────────────┐
│  Order Items       │
│  ┌──────────────┐  │
│  │ Item 1       │  │ ──┐
│  │  + Modifiers │  │   │
│  │  × Quantity  │  │   │
│  └──────────────┘  │   │
│  ┌──────────────┐  │   ├──► Sum
│  │ Item 2       │  │   │     │
│  │  + Modifiers │  │   │     │
│  │  × Quantity  │  │   │     ▼
│  └──────────────┘  │   │  ┌──────────┐
│  ┌──────────────┐  │   │  │ SUBTOTAL │
│  │ Item 3       │  │ ──┘  └────┬─────┘
│  │  + Modifiers │  │           │
│  │  × Quantity  │  │           │ - Discount
│  └──────────────┘  │           ▼
└────────────────────┘      ┌──────────────┐
                            │ After        │
                            │ Discount     │
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    │ + Tax        │ + Service    │ + Delivery/Packing
                    │              │   Charge     │
                    ▼              ▼              ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │   Tax    │   │ Service  │   │ Delivery │
              │  Amount  │   │  Charge  │   │  Charge  │
              └────┬─────┘   └────┬─────┘   └────┬─────┘
                   │              │              │
                   └──────────────┼──────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │ Total Before  │
                          │   Round-off   │
                          └───────┬───────┘
                                  │ + Round-off
                                  ▼
                          ┌───────────────┐
                          │ FINAL TOTAL   │
                          └───────┬───────┘
                                  │ - Paid Amount
                                  ▼
                          ┌───────────────┐
                          │ BALANCE DUE   │
                          └───────────────┘
```

---

## Kitchen Order Ticket (KOT) Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         ORDER                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Item 1   │  │ Item 2   │  │ Item 3   │  │ Item 4   │   │
│  │(Pending) │  │(Pending) │  │(Pending) │  │(Pending) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────┬─────────────┬──────────────┬────────────┬──────────┘
         │             │              │            │
         │ Send KOT #1 │              │            │ Send KOT #2
         │             │              │            │
    ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐ ┌──▼──────┐
    │ KOT #1   │  │ KOT #1   │  │ KOT #2   │ │ KOT #2  │
    │ Item 1   │  │ Item 2   │  │ Item 3   │ │ Item 4  │
    │ → Fired  │  │ → Fired  │  │ → Fired  │ │ → Fired │
    └────┬─────┘  └────┬─────┘  └────┬─────┘ └──┬──────┘
         │             │              │            │
         ▼             ▼              ▼            ▼
    ┌────────────────────────────────────────────────┐
    │           KITCHEN DISPLAY SYSTEM               │
    │  ┌──────────────┐      ┌──────────────┐      │
    │  │   KOT #1     │      │   KOT #2     │      │
    │  │   [COOKING]  │      │   [PENDING]  │      │
    │  └──────────────┘      └──────────────┘      │
    └────────────────────────────────────────────────┘
         │                            │
         ▼                            ▼
    [Items Ready]              [Items Ready]
         │                            │
         ▼                            ▼
    ┌────────────────────────────────────┐
    │      WAITER NOTIFICATION           │
    │   "Table 5 items ready to serve"  │
    └────────────────────────────────────┘
```

---

## Payment Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    COMPLETED ORDER                         │
│  Total: ₹1,000  |  Paid: ₹0  |  Balance: ₹1,000          │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       │ Generate Bill
                       ▼
            ┌──────────────────┐
            │  Order Status:   │
            │     BILLED       │
            └────────┬─────────┘
                     │
          ┌──────────┼──────────┬──────────┬──────────┐
          │          │          │          │          │
    ┌─────▼───┐ ┌───▼────┐ ┌──▼────┐ ┌───▼────┐ ┌──▼────┐
    │  CASH   │ │  CARD  │ │  UPI  │ │ WALLET │ │CREDIT │
    │ ₹500    │ │ ₹300   │ │ ₹200  │ │  ...   │ │  ...  │
    └────┬────┘ └───┬────┘ └──┬────┘ └───┬────┘ └──┬────┘
         │          │          │          │          │
         └──────────┼──────────┼──────────┼──────────┘
                    │          │          │
                    ▼          ▼          ▼
            ┌────────────────────────────┐
            │   Update Paid Amount       │
            │   ₹500 + ₹300 + ₹200 = ₹1000│
            └──────────┬─────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Balance: ₹0     │
            │  Status: PAID    │
            └──────────┬───────┘
                       │
                       │ Complete Order
                       ▼
            ┌──────────────────┐
            │  Order Status:   │
            │    COMPLETED     │
            └──────────────────┘
```

---

## Data Flow - Create Order

```
┌─────────────┐
│   CLIENT    │
│  (Waiter)   │
└──────┬──────┘
       │ POST /api/v1/orders
       │ {restaurantId, items[], ...}
       ▼
┌─────────────────┐
│  Controller     │ ─── Validate Request DTO
│  (API Layer)    │
└──────┬──────────┘
       │ Call service method
       ▼
┌─────────────────┐
│  Service        │ ─── Business Logic
│  (OrderService) │     │
└──────┬──────────┘     ├─ Validate restaurant
       │                ├─ Validate products
       │                ├─ Create Order entity
       │                ├─ Add OrderItems
       │                ├─ Calculate totals
       │                └─ Send KOT (if requested)
       ▼
┌─────────────────┐
│  Repository     │ ─── Data Access
│  (OrderRepo)    │     │
└──────┬──────────┘     ├─ Save order
       │                ├─ Save items
       │                └─ Save KOT
       ▼
┌─────────────────┐
│   Database      │ ─── Persist Data
│  (PostgreSQL)   │     │
└──────┬──────────┘     ├─ orders table
       │                ├─ order_items table
       │                └─ kitchen_order_tickets table
       │
       │ Return saved entity
       ▼
┌─────────────────┐
│    Mapper       │ ─── Convert Entity → DTO
│  (OrderMapper)  │
└──────┬──────────┘
       │ Return OrderResponse
       ▼
┌─────────────────┐
│   CLIENT        │ ─── Receive Response
│   (Waiter)      │     {orderUuid, orderNumber, ...}
└─────────────────┘
```

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                       │
│  Authorization: Bearer <JWT_TOKEN>                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Spring Security       │
        │  Filter Chain          │
        └─────────┬──────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ Authenticate │    │  Authorize   │
│    Token     │    │    Role      │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └───────┬───────────┘
               │
               ▼
    ┌──────────────────┐
    │   Controller     │
    │ @PreAuthorize    │
    │ ("hasRole...")   │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │    Service       │
    │ (Business Logic) │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │   Repository     │
    │ (Data Filter)    │
    └──────┬───────────┘
           │ WHERE restaurant_id = user.restaurant_id
           │ AND is_deleted = false
           ▼
    ┌──────────────────┐
    │    Database      │
    └──────────────────┘
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                           │
│  (Nginx / AWS ALB / Azure Load Balancer)                  │
└────────────────────┬───────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────┐ ┌──▼──────┐
│  App Server  │ │  App    │ │  App    │ │  App    │
│  Instance 1  │ │Instance2│ │Instance3│ │Instance4│
│ (Spring Boot)│ │         │ │         │ │         │
└───────┬──────┘ └──┬──────┘ └──┬──────┘ └──┬──────┘
        │           │           │           │
        └───────────┼───────────┼───────────┘
                    │           │
        ┌───────────┴───────────┴───────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│   PostgreSQL     │              │   Redis Cache    │
│   (Primary)      │              │   (Sessions)     │
│                  │              └──────────────────┘
└────────┬─────────┘
         │ Replication
         ▼
┌──────────────────┐
│   PostgreSQL     │
│   (Read Replica) │
│   (Reporting)    │
└──────────────────┘
```

---

**Visual diagrams help understand:**
- System architecture
- Data flow
- Entity relationships
- State machines
- Calculation logic
- Deployment topology

**For interactive diagrams, consider tools like:**
- draw.io
- Lucidchart
- PlantUML
- Mermaid

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0

