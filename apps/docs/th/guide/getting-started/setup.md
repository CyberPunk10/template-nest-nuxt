# การเตรียมความพร้อม

สิ่งที่ต้องติดตั้งและเตรียมครั้งเดียว ก่อนรันครั้งแรก

## 1. Node.js >= 24

```bash
node -v
```

เวอร์ชันถูกกำหนดไว้ใน `.nvmrc` และใน `engines` ของ `package.json` ที่ root ส่วน `.npmrc` ตั้ง `engine-strict=true` ไว้ ทำให้ `pnpm install` **ปฏิเสธ** การติดตั้งบน Node เวอร์ชันที่ไม่ตรง แทนที่จะติดตั้งเงียบๆ แล้วไปพังตอน runtime ทีหลัง

::: details วิธีติดตั้ง (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
```

จากนั้นที่ root ของโปรเจกต์ (ที่มีไฟล์ `.nvmrc`):

```bash
nvm install 24
nvm use 24
```

รายละเอียด — [nvm-sh/nvm](https://github.com/nvm-sh/nvm)
:::

## 2. pnpm >= 12

```bash
pnpm --version
```

เวอร์ชัน pnpm ที่แน่นอนถูกกำหนดไว้ใน `packageManager` ของ `package.json` ที่ root ใช้ pnpm 12 ขึ้นไปตัวไหนก็ได้ ในโฟลเดอร์โปรเจกต์ pnpm จะสลับไปใช้เวอร์ชันที่กำหนดไว้เอง และดาวน์โหลดมาในการรันครั้งแรก

::: details วิธีติดตั้ง
```bash
npm install -g pnpm
```

วิธีอื่น ๆ — [pnpm.io/installation](https://pnpm.io/installation) ในโฟลเดอร์โปรเจกต์ `pnpm --version` ควรแสดงเวอร์ชันตาม `packageManager`
:::

## 3. Docker >= 23 + Docker Compose >= 2.33

จำเป็นเฉพาะโหมด Docker — ถ้าใช้ `pnpm dev` ข้ามได้

```bash
docker --version
docker compose version
```

เวอร์ชันของ Compose สำคัญ: เวอร์ชันเก่ากว่านั้น build จะพังพร้อมข้อความ `failed to get build context docs` — [ทำไม](../structure/apps/docs/docker-image)

เทมเพลตนี้ทดสอบบน Docker `27.5.1` และ Compose `v5.5.0`

::: details วิธีติดตั้ง
คำแนะนำแบบเต็มตาม OS ของคุณ — [docs.docker.com/get-started/get-docker](https://docs.docker.com/get-started/get-docker/)

ทางลัดสำหรับ Linux:

```bash
curl -fsSL https://get.docker.com | sh
```
:::

## 4. ไฟล์ `.env`

ไม่จำเป็นต้องคัดลอก `.env.example` → `.env` ด้วยมือ: ตอนรันครั้งแรก script ตัวห่อจะทำให้เอง (`pnpm dev` → `predev.mjs`, `pnpm docker:up` → `predocker.mjs`) ทั้งคู่สร้างไฟล์ `.env` **ทั้งหมด** ที่ยังขาด — ทั้ง root, `apps/backend`, `apps/frontend`, `apps/docs`

ถ้าต้องการสร้างล่วงหน้า เช่น ก่อนรัน `docker compose up` ตรงๆ มีคำสั่งแยกให้:

```bash
pnpm env:copy
```

ตัวแปรไหนอยู่ที่ไหนและเพราะอะไร — ดู [ตัวแปรสภาพแวดล้อม](../env-variables)
