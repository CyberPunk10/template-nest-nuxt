# เวอร์ชัน pnpm ไม่ถูกต้อง

เวอร์ชัน pnpm ที่แน่นอนถูกกำหนดไว้ใน `packageManager` ของ `package.json` ที่ root pnpm 12 ขึ้นไปที่คุณติดตั้งไว้จะสลับไปใช้เวอร์ชันนั้นเองในโฟลเดอร์โปรเจกต์ ดังนั้นเวอร์ชัน global ของคุณอาจต่างออกไปได้ — เป็นเรื่องปกติ

## อาการ

`pnpm install` ไม่ยอมทำงาน:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment (bad pnpm and/or Node.js version)
Expected version: >=12
Got: 9.15.9
```

หรือ pnpm พยายามสลับไปใช้เวอร์ชันที่กำหนดไว้แล้วล้มเหลว:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: pnpm@12.15.0
```

หรือในโฟลเดอร์โปรเจกต์ `pnpm --version` แสดงเวอร์ชันที่ไม่ตรงกับ `packageManager`

## สาเหตุ

pnpm ที่ถูกรันเก่าเกินไป: เวอร์ชัน 9 และ 10 รุ่นแรก ๆ สลับไปใช้เวอร์ชันจาก `packageManager` ไม่ได้ pnpm แบบนี้มักหลงเหลือจากวิธีติดตั้งเดิม — ในเครื่องอาจมีหลายตัว และตัวที่อยู่ก่อนใน `$PATH` จะถูกรัน

## วิธีแก้

อัปเดต pnpm:

```bash
npm install -g pnpm
```

ถ้าในโฟลเดอร์โปรเจกต์ `pnpm --version` ยังไม่ตรงกับ `packageManager` ให้ดูว่ามี pnpm ติดตั้งอยู่กี่ตัว:

```bash
which -a pnpm
```

ตัวแรกในรายการคือตัวที่ถูกรัน ลบตัวที่เกินออก:

| Path | ติดตั้งโดย | วิธีลบ |
| --- | --- | --- |
| `~/.local/share/pnpm/pnpm` | สคริปต์จาก pnpm.io | `rm -rf ~/.local/share/pnpm` แล้วลบบล็อก `# pnpm … # pnpm end` ออกจาก `~/.zshrc` หรือ `~/.bashrc` |
| `~/.nvm/versions/node/vX.Y.Z/bin/pnpm` | `npm install -g pnpm` ภายใต้ nvm | `npm uninstall -g pnpm` ใน Node เวอร์ชันนั้น |
| `/usr/bin/pnpm` | npm ของระบบ | `sudo npm uninstall -g pnpm` |

หลังลบแต่ละตัว ให้ตรวจ `which -a pnpm` และ `pnpm --version` อีกครั้ง
