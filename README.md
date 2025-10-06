account test:
- Admin:admin1@gmail.com / 123
- Club Manager: clubmanager@gmail.com / 123
- Student: student@gmail.com / 123
- University Admin: universityadmin@gmail.com / 123

🎓 SEP490 – UniClub (SCLMS)
**Student Club Loyalty & Membership System**
Hệ thống quản lý thẻ thành viên CLB sinh viên với ưu đãi và tích điểm
👉 Website (demo deploy): https://uniclub-fpt.vercel.app/
📑 Table of Contents
- Description
- Features & Actors
- Technology Stack
- System Architecture
- Documentation & Deliverables
- Getting Started
- Team Members
- Supervisors
- License & Copyright
📝 Description
University student clubs currently manage members manually (Excel, paper lists, chat groups).
This leads to fragmented data, errors, fraud risk, and difficulty in distributing vouchers or partner gifts.

UniClub (SCLMS) solves this by providing:
- 🎟️ Digital membership management (roles, levels, tiering).
- 📅 Event & Section management with dynamic QR (5s) + OTP check-in.
- 💰 Wallet & point system with point caps, MoMo top-up (10,000 VND = 100 points).
- 🎁 Voucher & product redemption (on-site pickup at Delivery Sessions).
- 🔄 Return/refund support based on club policy.
- 📊 Dashboards for University Admin & Club Managers.
- 🤖 AI Chatbot for FAQ, guidance, tier/points inquiry.

🎯 Non-profit project: All funds go back to clubs for student activities.
👥 Features & Actors
University Admin:
- Approve clubs, events, system configurations.
- Cross-club reports, fraud monitoring.

Club Manager:
- Approve/reject member applications.
- Manage membership levels, events, products, refunds.
- Configure points, caps, and wallets.
- View club-level dashboards.

Club Staff:
- Manage inventory (stock movements).
- Handle returns & refunds.

Student (Club Member):
- Join clubs & events, check-in via QR+OTP.
- Earn points, redeem products.
- Request refunds within policy.
- Track history: attendance, wallet, products, tier progress.

External Systems:
- MoMo Gateway: Top-up & payments.
- Email/Web Notifications: Accounts, redeems, top-ups, tiers.
- AI Chatbot: FAQ, tier/points guide.
🛠 Technology Stack
- Frontend: React (TypeScript, Tailwind, Shadcn UI)
- Backend: Java Spring Boot
- Database: PostgreSQL / MySQL
- Mobile (optional): Android (Java/Kotlin)
- Deployment: Vercel (FE), Cloud (Heroku/Azure/AWS)
- Security: JWT Authentication, OTP, Audit Logs
🏗 System Architecture
- Membership API: accounts, membership levels, tiering.
- Event API: event/section, QR + OTP check-in, attendance.
- Wallet/Points API: ledger, top-up, cap enforcement.
- Product API: catalog, redeem, delivery sessions, refund.
- Reporting API: dashboards for Admin & Managers.

(See full diagrams in `/docs` folder.)
📚 Documentation & Deliverables
- URD, SRS, Use Case & UML diagrams
- Architecture Design
- Test Plan & Report
- Installation & Deployment Guide
- Source Code (Frontend + Backend)
- Deployable Packages
🚀 Getting Started
### Clone source

git clone https://github.com/your-org/uniclub.git
### Backend (Spring Boot)
1. Configure `application.properties` with your DB & MoMo credentials.
2. Run:
./mvnw spring-boot:run
### Frontend (React)
1. Navigate to `/frontend` folder.
2. Install dependencies:
npm install
npm install axios (Optional)
3. Start app:
npm run build
# Nếu muốn xóa build cũ trước khi build lại:
# (Tùy dự án, thường là 'build' hoặc 'dist')
rm -rf build
npm run build
npm start

# pnpm chưa được cài đặt
1. Cài đặt pnpm toàn cục: Mở terminal/cmd và chạy:
npm install -g pnpm
2. Kiểm tra lại
pnpm --version
3. Chạy lại lệnh cài đặt:
pnpm install


👨‍👩‍👦 Team Members
- Phạm Trung Nguyên – Leader (SE170458)
- Tạ Minh Đức – Member (SE171695)
- Châu Ngọc Anh Trí – Member (SE173284)
- Phan Quang Anh – Member (SE185118)
🎓 Supervisors
- Ms. Bùi Thị Thu Thủy – thuybtt21@fe.edu.vn
- Ms. Trương Thị Mỹ Ngọc – ngocttm4@fe.edu.vn
📄 License & Copyright
© 2025 FPT University – Non-profit academic project.
All rights reserved for educational & research purposes.
👉 Hope to pass SEP490 successfully 🤟