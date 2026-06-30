# ห้องเรียนวิทยาศาสตร์ — โครงสร้างและหน้าที่ของเซลล์

**ครูพิชาภัค จันทร์งาม | โรงเรียนหนองหานวิทยา**

เว็บไซต์ห้องเรียนวิทยาศาสตร์เชิงโต้ตอบ สำหรับรายวิชาวิทยาศาสตร์ ม.1
ครอบคลุมโครงสร้างและหน้าที่ของเซลล์พืชและเซลล์สัตว์

## วิธีเปิดใช้งาน

### เปิดผ่าน GitHub Pages
1. Push โค้ดขึ้น GitHub repository
2. ไปที่ Settings → Pages → Branch: main / root
3. เว็บจะพร้อมใช้ที่ `https://<username>.github.io/<repo>/`

### เปิดผ่าน Local Server
```bash
cd science-class-cell
python -m http.server 8000
```
แล้วเปิด http://localhost:8000

## โครงสร้างไฟล์

```
science-class-cell/
├── index.html          # หน้าหลัก
├── style.css           # สไตล์ทั้งหมด
├── script.js           # JavaScript (interactive cell, quiz)
├── logo.png            # โลโก้โรงเรียน
├── video.mp4           # วิดีโอประกอบการเรียน
├── model/
│   ├── micro3d.js      # Three.js 3D Microscope Viewer
│   └── textures/       # PBR Textures
├── สาหร่ายหางกระรอก/   # ภาพขั้นตอนปฏิบัติการ
└── เยื่อบุข้างแก้ม/    # ภาพขั้นตอนปฏิบัติการ
```

## คุณสมบัติ

- 🔬 กล้องจุลทรรศน์ 3D แบบ Interactive (หมุนได้)
- 🌿 ขั้นตอนการทดลองพร้อมภาพจริง
- 🧬 Interactive Cell Diagram (คลิกดูส่วนประกอบ)
- 📝 แบบทดสอบ Quiz
- 🎬 วิดีโอพื้นหลัง Hero Section
