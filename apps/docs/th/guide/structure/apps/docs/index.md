# apps/docs

VitePress หน้าเอกสารคือไฟล์ markdown ธรรมดา path ของไฟล์กลายเป็น URL

```
apps/docs/
├── .vitepress/
│   ├── config.ts               config: locale, sidebar, theme
│   ├── config/                 ไฟล์แยกตามภาษา
│   ├── theme/                  ปรับแต่ง theme, component ของหน้าแรก
│   └── locales/                คำแปลของ UI (ไม่ใช่เนื้อหาหน้าเอกสาร)
├── guide/                      หน้าภาษารัสเซีย
├── en/guide/                   หน้าเดียวกันภาษาอังกฤษ
├── th/guide/                   และภาษาไทย
├── public/icons/               ไอคอนไฟล์สำหรับ sidebar
├── index.md                    หน้าแรก
└── Dockerfile                  build static file สำหรับ image ของ nginx
```

## สามภาษา

ภาษารัสเซียเป็นภาษาหลัก อยู่ที่ root (`/guide/...`) ส่วนอังกฤษกับไทยอยู่ในโฟลเดอร์ย่อยที่มีโครงสร้างเหมือนกัน (`/en/guide/...`)

โครงสร้างหน้าเอกสาร **เหมือนกันทุกภาษา**: เพิ่มไฟล์ใน `guide/` ก็ต้องเพิ่มใน `en/guide/` และ `th/guide/` ด้วย ไม่งั้น sidebar จะไม่ตรงกัน ตัว sidebar เองกำหนดแยกตามภาษาใน `.vitepress/config/`

## Dockerfile ที่ไม่ได้รันอะไร

Image ของ `apps/docs` ไม่ได้ start process อะไรเลย: มันแค่ build static file ให้ image ของ nginx เอาไปใช้ ใน Compose จึงไม่มี container ของเอกสารแยกต่างหาก — ดู [Dockerfile](./docker-image)

สคริปต์ของ application — [package.json](./package-json)
