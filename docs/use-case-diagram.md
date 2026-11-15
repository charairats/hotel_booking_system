# Use Case Diagram: Hotel Booking System

```mermaid
---
config:
  theme: redux
  fontFamily: '''Open Sans Variable'', sans-serif'
---
usecase-beta
    direction LR
    actor Guest("Guest")
    actor User("User")
    actor Admin("Admin")
    actor PaymentGateway("Payment Gateway")

    systemBoundary System["Hotel Booking System"]
        Register("Register")
        Login("Login")
        ViewHotels("View Hotels")
        BookHotel("Book Hotel")
        ApplyPromotion("Apply Promotion Code")
        ViewOwnBookings("View Own Bookings")
        UpdateBooking("Update Booking")
        CancelBooking("Cancel Booking")
        PayBooking("Pay for Booking")
        EarnPoints("Earn Loyalty Points")
        ViewPoints("View Loyalty Points")
        ManageBookings("Manage Bookings")
        ManageHotels("Manage Hotels")
        ManagePromotions("Manage Promotions")
    end

    Guest --> Register
    Guest --> ViewHotels

    User --> Login
    User --> ViewHotels
    User --> BookHotel
    User --> ViewOwnBookings
    User --> UpdateBooking
    User --> CancelBooking
    User --> PayBooking
    User --> ViewPoints

    Admin --> Login
    Admin --> ManageBookings
    Admin --> ManageHotels
    Admin --> ManagePromotions

    PayBooking --> PaymentGateway

    ApplyPromotion ..> : extend BookHotel
    PayBooking ..> : include EarnPoints
```
