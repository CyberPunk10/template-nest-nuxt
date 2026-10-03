# เริ่มต้นใช้งาน

## เริ่มแบบเร็ว

ต้องมี [Node.js >= 24 และ pnpm](./setup) — ที่เหลือ script จัดการให้:

```bash
git clone git@github.com:CyberPunk10/template-nest-nuxt.git
cd template-nest-nuxt
pnpm install
pnpm dev
```

เปิดที่ [http://localhost:3200](http://localhost:3200) ส่วนที่เหลือในหน้านี้เป็นเรื่องว่าโหมดนี้ต่างจาก Docker อย่างไร และต้องตั้งค่าอะไรถ้ามีอะไรไม่ทำงาน

## รันอย่างไร

แอปรันอยู่ที่ไหน กับเป็น build แบบไหน เป็นคนละเรื่องกัน ในเทมเพลตนี้ตั้งค่าไว้แล้วสามในสี่แบบ:

|          | บน host                                                                      | ใน container                                             |
| -------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| **dev**  | [`pnpm dev`](./run-pnpm)                             | ยังไม่ได้ตั้งค่า                                               |
| **prod** | [`pnpm build` + `start:prod`](./run-pnpm#pnpm-build) | [`pnpm docker:up`](./run-docker) |

- งานประจำวันใช้ `pnpm dev`
- ถ้าต้องการตรวจสอบ build แบบ production ทั้งชุดพร้อม reverse proxy ให้ใช้ `pnpm docker:up`

วิธีเข้าถึงก็ต่างกันด้วย:

- บน host แต่ละแอปฟังพอร์ตของตัวเอง
- ใน container traffic ทั้งหมดเข้ามาที่ reverse proxy

## เริ่มจากตรงไหน

1. [การเตรียมความพร้อม](./setup) — Node.js, pnpm, Docker, ไฟล์ `.env`
2. [รันด้วย pnpm](./run-pnpm) หรือ [ด้วย Docker](./run-docker)

## ต่างกันอย่างไรในทางปฏิบัติ

| อะไร          | `pnpm dev`                        | `pnpm docker:up`               |
| ------------- | --------------------------------- | ------------------------------ |
| Application   | `http://localhost:3200`           | `http://localhost/`            |
| เอกสาร        | `http://localhost:5173/dev/docs/` | `http://localhost/dev/docs/`   |
| Swagger       | `http://localhost:3100/api/docs`  | `http://localhost/api/docs`    |
| Hot reload    | มี                                 | ไม่มี — เป็น image แบบ production |
| Reverse proxy | ไม่มี                               | มี                              |

path ตรงกัน ต่างแค่ host กับพอร์ต — address ถูกเก็บไว้ใน environment variable เพื่อให้โค้ดไม่ต้องรู้จักมัน
