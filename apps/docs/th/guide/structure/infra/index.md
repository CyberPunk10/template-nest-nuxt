# infra/

Infrastructure ที่ไม่ใช่แอปพลิเคชัน

```
infra/
└── nginx/
    ├── nginx.conf.template
    └── Dockerfile
```

ตอนนี้มีแค่ reverse proxy วางอยู่นอก `apps/` เพราะให้บริการทั้ง stack ไม่ใช่แอปใดแอปหนึ่ง: แจกเอกสาร, proxy Swagger และ forward ที่เหลือไปยัง frontend

ข้างในมีอะไร — [nginx](./nginx/)
