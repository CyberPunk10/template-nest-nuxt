# ปัญหาที่พบบ่อย

อาการและวิธีแก้ของข้อผิดพลาดที่มักเจอเมื่อเริ่มรันโปรเจกต์

- [เวอร์ชัน pnpm ไม่ถูกต้อง](./pnpm) — `ERR_PNPM_UNSUPPORTED_ENGINE`, `pnpm --version` ไม่ตรงกับ `packageManager`
- [พอร์ตถูกใช้งานอยู่](./ports) — กล่องโต้ตอบเรื่องพอร์ตไม่ว่าง, `address already in use`
- [ไม่ได้สร้างเครือข่าย Docker](./docker-network) — `docker network create` ล้มเหลว, `declared as external, but could not be found`
- [ไม่มีไฟล์ `.env`](./env-files) — `no port specified`, `env file ... not found`, ขาดตัวแปรใหม่
