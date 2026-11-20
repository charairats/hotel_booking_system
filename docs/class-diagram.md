# Class Diagram: Hotel Booking System

This diagram follows the Mongoose models in `models/`. It shows stored fields and model methods; `_id` is created by Mongoose.

```mermaid
classDiagram
    direction LR

    class User {
        ObjectId _id
        String name
        String email
        String tel
        String role
        Number points
        String password
        String resetPasswordToken
        Date resetPasswordExpire
        Date createdAt
        +getSignedJwtToken()
        +matchPassword(enteredPassword)
    }

    class Hotel {
        ObjectId _id
        String name
        String address
        String district
        String province
        String postalcode
        String tel
        String region
        Number pricePerNight
        Number maxNights
        Date createdAt
    }

    class Booking {
        ObjectId _id
        ObjectId user
        ObjectId hotel
        Date checkInDate
        Date checkOutDate
        Number numOfNights
        Number subTotal
        String promoCode
        Number discount
        Number totalPrice
        String status
        PaymentDetails payment
        Number pointsEarned
        Date createdAt
    }

    class PaymentDetails {
        String method
        Date paidAt
        String transactionId
    }

    class Promotion {
        ObjectId _id
        String code
        String discountType
        Number discountValue
        Date validUntil
        Boolean isActive
        Date createdAt
    }

    User "1" <-- "0..*" Booking : user
    Hotel "1" <-- "0..*" Booking : hotel
    Booking "1" *-- "0..1" PaymentDetails : payment
    Promotion "0..1" <-- "0..*" Booking : applies promoCode
```

## ความสัมพันธ์และข้อกำหนด

- Booking แต่ละรายการเก็บ ObjectId ของ `user` และ `hotel` โดย User หรือ Hotel หนึ่งรายการมี Booking ได้หลายรายการ
- ข้อมูล `payment` ฝังอยู่ใน Booking ไม่ได้เป็น Collection แยกใน MongoDB วิธีชำระเงินที่รองรับคือ `credit_card`, `debit_card` และ `qr_code`
- Booking หนึ่งรายการใช้ Promotion ได้ `0..1` รายการ โดยเก็บ `promoCode` เป็นข้อความและคำนวณส่วนลดใน `controllers/bookings.js` ส่วน Promotion หนึ่งรายการใช้ได้กับหลาย Booking (`0..*`)
- สถานะของ Booking คือ `pending`, `paid` หรือ `cancelled`; ประเภทส่วนลดของ Promotion คือ `percentage` หรือ `fixed`; บทบาทของ User คือ `user` หรือ `admin`
- Hotel มี virtual field ชื่อ `bookings` สำหรับดู Booking ที่เกี่ยวข้อง และเมื่อลบ Hotel ระบบจะลบ Booking ของโรงแรมนั้นก่อนลบ Hotel ใน `controllers/hotels.js`
