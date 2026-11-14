# Sequence Diagram: Book Hotel (POST)

การสร้าง Booking ผ่าน `POST /api/v1/hotels/:hotelId/bookings` โดยส่ง Bearer token, `checkInDate`, `checkOutDate` และ `promoCode` หากต้องการใช้ส่วนลด

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Server as server.js
    participant HotelRoute as routes/hotels.js
    participant BookingRoute as routes/bookings.js
    participant Auth as middleware/auth.js
    participant Controller as controllers/bookings.js
    participant Hotel as Hotel model
    participant Promotion as Promotion model
    participant Booking as Booking model
    participant DB as MongoDB

    User->>Server: POST /api/v1/hotels/:hotelId/bookings
    Server->>HotelRoute: ส่งต่อคำขอไปยัง /api/v1/hotels
    HotelRoute->>BookingRoute: ส่งต่อ /:hotelId/bookings
    BookingRoute->>Auth: protect และ authorize('admin', 'user')
    Auth->>Auth: ตรวจ Bearer JWT และโหลด req.user

    alt ไม่ผ่านการตรวจสิทธิ์
        Auth-->>User: 401 หรือ 403 { success: false, message }
    else ผ่านการตรวจสิทธิ์
        Auth-->>BookingRoute: next()
        BookingRoute->>Controller: addBooking(req, res)
        Controller->>Hotel: findById(req.params.hotelId)
        Hotel->>DB: ค้นหา Hotel
        DB-->>Hotel: ข้อมูล Hotel หรือไม่พบ
        Hotel-->>Controller: ผลการค้นหา

        alt ไม่พบ Hotel
            Controller-->>User: 404 { success: false, message }
        else พบ Hotel
            Controller->>Controller: กำหนด user จาก req.user.id
            Controller->>Controller: ตรวจวันเข้าพักและจำนวนคืนไม่เกิน 30

            alt ข้อมูลวันไม่ถูกต้อง
                Controller-->>User: 400 { success: false, message }
            else ข้อมูลวันถูกต้อง
                Controller->>Controller: subTotal = จำนวนคืน × pricePerNight
                opt มี promoCode
                    Controller->>Promotion: findOne({ code: promoCode })
                    Promotion->>DB: ค้นหา Promotion
                    DB-->>Promotion: ข้อมูล Promotion
                    Promotion-->>Controller: Promotion
                    Controller->>Controller: ตรวจ isActive และ validUntil แล้วคำนวณ discount
                end
                Controller->>Controller: totalPrice = subTotal - discount
                Controller->>Booking: create({ user, hotel, dates, prices, status: 'pending' })
                Booking->>DB: บันทึก Booking
                DB-->>Booking: Booking ที่บันทึกแล้ว
                Booking-->>Controller: booking
                Controller-->>User: 201 { success: true, data: booking }
            end
        end
    end
```

## เงื่อนไขที่ใช้จริง

- ต้องมี `checkInDate` และ `checkOutDate` ที่แปลงเป็นวันที่ได้ โดยวันออกต้องหลังวันเข้า และจองได้ไม่เกิน 30 คืน หากไม่ผ่านจะได้ HTTP 400
- หากส่ง `promoCode` ระบบตรวจว่าโค้ดมีอยู่ เปิดใช้งาน ยังไม่หมดอายุ และจำนวนส่วนลดถูกต้อง หากไม่ผ่านจะได้ HTTP 400 และไม่สร้าง Booking
- หากไม่ส่ง `promoCode` ค่า `discount` เป็น 0; หากส่งโค้ดที่ถูกต้อง ระบบคำนวณส่วนลดแบบเปอร์เซ็นต์หรือจำนวนเงิน และไม่ให้ส่วนลดเกิน `subTotal`
- Booking ใหม่มี `status` เป็น `pending` และผูกกับ User ที่อยู่ใน JWT ไม่ใช้ User ID ที่ผู้เรียกส่งมา
- Endpoint `POST /api/v1/bookings` เรียก `addBooking` เดียวกัน โดยรับ Hotel ID จากฟิลด์ `hotel` ใน body แทนพารามิเตอร์ใน URL
