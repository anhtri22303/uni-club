# UniClub Frontend

**Student Club Loyalty & Membership System (SCLMS)**  
Digital platform for managing university student club memberships, events, points, and rewards.

Demo: [https://uniclub.id.vn](https://uniclub.id.vn/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)
- [Contact](#contact)

---

## Overview

UniClub is a non-profit web application designed to streamline student club membership management at universities. The frontend is built with React and TypeScript, providing a modern, responsive user experience for club members, staff, and administrators.

---

## Features

- Digital membership cards with tiering and roles
- Event & session management with QR/OTP check-in
- Wallet and points system (MoMo integration)
- Product/voucher redemption and delivery session scheduling
- Refund/return support per club policy
- Dashboards for club leaders and university admins
- AI Chatbot for FAQs and tier/points inquiries
- Email/web notifications for key actions

---

## Technology Stack

- **Framework:** React (TypeScript)
- **UI:** Tailwind CSS, Shadcn UI
- **State Management:** Context API / Redux (if used)
- **HTTP Client:** Axios
- **Deployment:** Vercel
- **Authentication:** JWT, OTP

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/uniclub.git
   cd uniclub/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   pnpm start
   ```

4. Build for production:
   ```bash
   npm run build
   # or
   pnpm build
   ```

---

## Available Scripts

- `npm start` / `pnpm start` – Run development server
- `npm run build` / `pnpm build` – Build production assets
- `npm run lint` – Lint codebase
- `npm run test` – Run tests (if configured)

---

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route-based pages
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utility functions
│   ├── assets/       # Images, icons, etc.
│   ├── App.tsx       # Main app component
│   └── index.tsx     # Entry point
├── package.json
├── tailwind.config.js
└── README.md
```

---

## Contributing

Contributions are welcome!  
Please fork the repository and submit a pull request.  
Follow the code style and naming conventions used in the project.

---

## Team

- Phạm Trung Nguyên – Leader (SE170458)
- Tạ Minh Đức – Member (SE171695)
- Châu Ngọc Anh Trí – Member (SE173284)
- Phan Quang Anh – Member (SE185118)

---

## License

© 2025 FPT University – Non-profit academic project.  
For educational and research purposes only.

---

## Contact

- Supervisors:
  - Ms. Bùi Thị Thu Thủy – thuybtt21@fe.edu.vn
  - Ms. Trương Thị Mỹ Ngọc – ngocttm4@fe.edu.vn

For issues or questions, please open an issue on GitHub.
