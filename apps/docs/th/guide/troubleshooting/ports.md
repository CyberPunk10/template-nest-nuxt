# พอร์ตถูกใช้งานอยู่

## อาการ

`pnpm dev` หรือ `pnpm docker:up` หยุดและถามว่าจะทำอย่างไรกับพอร์ตที่ไม่ว่าง:

```
Port conflict: backend=3100
What would you like to do?
  Kill existing processes and use same ports (3100, 3200, 5173)
  Abort
```

หรือเมื่อรัน `docker compose up` โดยตรง:

```
Bind for 0.0.0.0:80 failed: port is already allocated
```

## สาเหตุ

มีบางอย่างรอรับบนพอร์ตจาก `.env` อยู่แล้ว: `pnpm dev` ก่อนหน้าในเทอร์มินัลอื่น, โปรเซสที่ค้างหลังปิดเทอร์มินัล หรือโปรแกรมอื่น

`pnpm dev` ตรวจ `PORT` จาก `apps/backend/.env`, `apps/frontend/.env` และ `apps/docs/.env` ส่วน `pnpm docker:up` ตรวจ `NGINX_HOST_PORT` จาก `.env` ที่ root

## วิธีแก้

เลือก `Kill existing processes` ในกล่องโต้ตอบ — [`predev.mjs`](../structure/scripts/predev) จะหยุด `pnpm dev` ก่อนหน้าทั้งหมดก่อน แล้วจึงปิดสิ่งอื่นที่ยังจับพอร์ตอยู่

ถ้าพอร์ตถูกใช้โดยโปรแกรมที่หยุดไม่ได้ ให้เปลี่ยนพอร์ตใน `.env` ที่เกี่ยวข้อง

`docker compose up` โดยตรงไม่ตรวจพอร์ต — ให้รันผ่าน `pnpm docker:up` หรือปล่อยพอร์ตเอง

### Windows

การปิดโปรเซสจากกล่องโต้ตอบใช้ได้เฉพาะบน macOS และ Linux บน Windows ให้หาโปรเซสแล้วปิดเอง:

```powershell
netstat -ano | findstr :3100
taskkill /PID <PID> /F
```
