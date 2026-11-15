# Use Case Diagram: Hotel Booking System

แผนภาพนี้แสดงความสามารถของระบบตาม routes และ controllers ปัจจุบัน โดยแยกผู้เยี่ยมชม ผู้ใช้ที่เข้าสู่ระบบ และผู้ดูแลระบบ

```mermaid
usecase-beta
    direction LR
    actor Guest("ผู้เยี่ยมชม")
    actor User("ผู้ใช้")
    actor Admin("ผู้ดูแลระบบ")

    systemBoundary System["Hotel Booking System"]
        Register("สมัครสมาชิก")
        Login("เข้าสู่ระบบ")
        BrowseHotels("ดูโรงแรม")
        BrowsePromotions("ดูโปรโมชัน")
        Profile("ดูข้อมูลและคะแนนสะสมของตน")
        Logout("ออกจากระบบ")
        ManageBooking("จัดการการจอง")
        ApplyPromotion("ใช้รหัสโปรโมชัน")
        PayBooking("ชำระเงินสำหรับการจอง")
        PaymentGatewayStub("จำลอง Payment Gateway")
        EarnPoints("รับคะแนนสะสม")
        ManageHotel("จัดการโรงแรม")
        ManagePromotion("จัดการโปรโมชัน")
    end

    User --|> Guest
    Admin --|> User

    Guest --> Register
    Guest --> Login
    Guest --> BrowseHotels
    Guest --> BrowsePromotions

    User --> Profile
    User --> Logout
    User --> ManageBooking
    User --> PayBooking

    Admin --> ManageBooking
    Admin --> ManageHotel
    Admin --> ManagePromotion

    ApplyPromotion ..> : extend ManageBooking
    PayBooking ..> : include PaymentGatewayStub
    PayBooking ..> : include EarnPoints
```

- การดูโรงแรมและโปรโมชันเป็นบริการสาธารณะ ผู้ใช้และผู้ดูแลระบบก็เรียกใช้ได้
- “จัดการการจอง” ครอบคลุมการสร้าง ดู แก้ไข และลบการจอง ผู้ใช้จัดการได้เฉพาะการจองของตน ส่วนผู้ดูแลระบบจัดการการจองของผู้ใช้อื่นได้ด้วย
- “จัดการโรงแรม” และ “จัดการโปรโมชัน” ครอบคลุมการเพิ่ม แก้ไข และลบ โดยจำกัดสิทธิ์เฉพาะผู้ดูแลระบบ
- การใช้รหัสโปรโมชันเป็นทางเลือกเฉพาะตอนสร้างการจอง ระบบตรวจรหัสแล้วคำนวณส่วนลดก่อนบันทึกการจอง
- “Payment Gateway Stub” คือการจำลองการชำระเงินภายใน `payBooking`: รองรับ `credit_card`, `debit_card` และ `qr_code` แล้วสร้าง transaction ID และบันทึกสถานะ `paid` โดยไม่มีการเรียกบริการภายนอก เมื่อสำเร็จระบบเพิ่มคะแนนให้เจ้าของการจอง

แผนภาพใช้ไวยากรณ์ `usecase-beta` ซึ่งต้องใช้ Mermaid 12 ขึ้นไปในการแสดงผล
