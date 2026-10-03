# scripts/

Node script ที่อยู่เบื้องหลังคำสั่งใน `package.json`

```
scripts/
├── predev.mjs          ก่อน pnpm dev: .env + พอร์ต + ฐานข้อมูล
├── predocker.mjs       ก่อน pnpm docker:up: .env + พอร์ต proxy + network
├── copy-env.mjs        path ของ .env, การคัดลอก, parseEnv
├── copy-env-cli.mjs    CLI wrapper สำหรับ pnpm env:copy
├── check-ports.mjs     ตรวจสอบพอร์ตที่ถูกใช้, dialog
├── ensure-network.mjs  สร้าง Docker network
├── log.mjs             prefix สำหรับข้อความของ script เอง
├── db.mjs              start/stop container ฐานข้อมูล
├── dev.mjs             รัน 3 application พร้อมกัน
└── reinstall.mjs       ติดตั้ง dependency ใหม่ตั้งแต่ต้น
```
