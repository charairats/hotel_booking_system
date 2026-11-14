# Sequence Diagram: Manage Hotel (POST)

Endpoint: `POST /api/v1/hotels` — ผู้ดูแลระบบสร้างข้อมูลโรงแรม

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Server as server.js
    participant Route as routes/hotels.js
    participant Auth as middleware/auth.js
    participant User as User model
    participant Controller as controllers/hotels.js
    participant Hotel as Hotel model
    participant DB as MongoDB

    Admin->>Server: POST /api/v1/hotels<br/>Bearer token + ข้อมูลโรงแรม
    Server->>Route: ส่งคำขอไปยัง router /api/v1/hotels
    Route->>Auth: protect(req)
    Auth->>Auth: อ่านและตรวจสอบ JWT

    alt ไม่มี Token หรือ Token ไม่ถูกต้อง
        Auth-->>Admin: 401 { success: false, message }
    else Token ถูกต้อง
        Auth->>User: findById(decoded.id)
        User->>DB: ค้นหาผู้ใช้
        DB-->>User: เอกสารผู้ใช้
        User-->>Auth: req.user
        Auth-->>Route: next()
        Route->>Auth: authorize('admin')

        alt ผู้ใช้ไม่ใช่ผู้ดูแลระบบ
            Auth-->>Admin: 403 { success: false, message }
        else ผู้ใช้เป็นผู้ดูแลระบบ
            Auth-->>Route: next()
            Route->>Controller: createHotel(req, res)
            Controller->>Hotel: Hotel.create(req.body)
            Hotel->>Hotel: ตรวจสอบข้อมูลตาม Hotel schema

            alt ข้อมูลโรงแรมไม่ถูกต้อง
                Hotel-->>Controller: ข้อผิดพลาดจากการตรวจสอบข้อมูล
                Controller-->>Admin: 400 { success: false, message }
            else ข้อมูลถูกต้อง
                Hotel->>DB: เพิ่มข้อมูลโรงแรม
                alt ชื่อโรงแรมซ้ำ
                    DB-->>Hotel: ข้อผิดพลาดจากคีย์ซ้ำ
                    Hotel-->>Controller: ข้อผิดพลาดจากคีย์ซ้ำ
                    Controller-->>Admin: 400 { success: false, message }
                else เพิ่มข้อมูลสำเร็จ
                    DB-->>Hotel: ข้อมูลโรงแรมที่บันทึกแล้ว
                    Hotel-->>Controller: hotel
                    Controller-->>Admin: 201 { success: true, data: hotel }
                end
            end
        end
    end
```

ข้อมูลโรงแรมเป็นไปตาม `models/Hotel.js` ได้แก่ `name`, `address`, `district`, `province`, `postalcode` และ `pricePerNight`; ฟิลด์ที่ไม่บังคับ ได้แก่ `tel` และ `region`
