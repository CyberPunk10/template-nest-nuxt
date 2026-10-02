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

จากนั้นที่ root ของ repository (ที่มีไฟล์ `.nvmrc`):

```bash
nvm install 24
nvm use 24
```

รายละเอียด — [nvm-sh/nvm](https://github.com/nvm-sh/nvm)
:::

## 2. pnpm >= 11 ผ่าน Corepack

```bash
pnpm --version
```

เวอร์ชัน pnpm ถูกกำหนดไว้ใน `packageManager` ของ `package.json` ที่ root — วิธีที่แนะนำคือใช้ [Corepack](https://nodejs.org/api/corepack.html) ซึ่งมาพร้อมกับ Node.js

::: details วิธีติดตั้ง (Corepack)
```bash
corepack enable
```

หลังจากนั้น `pnpm` ในโปรเจกต์นี้จะเป็นเวอร์ชันที่ระบุใน `packageManager` ถ้ามี pnpm ตัวอื่นติดตั้งแบบ global อยู่แล้ว มันอาจดักการเรียกก่อน Corepack shim แล้วใช้เวอร์ชันอื่นแทน ตรวจสอบด้วย `pnpm --version` และถ้าไม่ตรงกับ `packageManager` ให้ดู [pnpm และ Corepack](../pnpm)
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

## 4. Docker network

ใช้เฉพาะโหมด Docker เช่นกัน ถ้ารันผ่าน `pnpm docker:up` จะถูกสร้างให้อัตโนมัติ — ไม่ต้องทำขั้นตอนนี้แยก

ถ้ารัน `docker compose` ตรงๆ ให้สร้างเองครั้งเดียว:

```bash
docker network create template-nest-nuxt_app
```

ถ้าไม่มี `docker compose up` แบบตรงๆ จะล้มเหลวด้วย `network ... declared as external, but could not be found` — [ทำไม network ถึงเป็น external](../structure/docker-compose#network)

## 5. ไฟล์ `.env`

ไม่จำเป็นต้องคัดลอก `.env.example` → `.env` ด้วยมือ: ตอนรันครั้งแรก script ตัวห่อจะทำให้เอง (`pnpm dev` → `predev.mjs`, `pnpm docker:up` → `predocker.mjs`) ทั้งคู่สร้างไฟล์ `.env` **ทั้งหมด** ที่ยังขาด — ทั้ง root, `apps/backend`, `apps/frontend`, `apps/docs`

ถ้าต้องการสร้างล่วงหน้า เช่น ก่อนรัน `docker compose up` ตรงๆ มีคำสั่งแยกให้:

```bash
pnpm env:copy
```

ตัวแปรไหนอยู่ที่ไหนและเพราะอะไร — ดู [ตัวแปรสภาพแวดล้อม](../env-variables)

::: tip
ตอนสลับ branch ไฟล์ `.env` ในเครื่องจะไม่อัปเดตอัตโนมัติ — อาจขาดตัวแปรของ branch ใหม่ไป เทียบกับ `.env.example` แล้วเพิ่มตัวที่ขาดเข้าไป
:::
