TECHNICAL APPROACH

Personal Asset Management Web App (CSV / Excel-based Storage)

1. Tổng quan kiến trúc
1.1 Nguyên tắc thiết kế

❌ Không dùng database (MySQL, Postgres, Mongo…)

✅ Lưu data bằng CSV / Excel (.xlsx)

✅ Dữ liệu human-readable, dễ chỉnh tay

✅ Có thể mở bằng Excel / Google Sheets

✅ Phù hợp personal / single-user / small team

1.2 High-level Architecture
Browser (Web UI)
     |
     v
Frontend (React / Next.js)
     |
     v
Backend API (Node.js / Python)
     |
     v
File Storage (CSV / Excel)


📌 Backend đóng vai trò:

Đọc / ghi file CSV, Excel

Tính toán NAV, Profit, XIRR

Validate dữ liệu

2. Tech Stack đề xuất
2.1 Frontend

React hoặc Next.js

Chart: Recharts / Chart.js

Table: TanStack Table

Form: React Hook Form

2.2 Backend (2 option)
OPTION A – Node.js (khuyên dùng)

Node.js + Express / Fastify

CSV: csv-parser, csv-writer

Excel: xlsx hoặc exceljs

XIRR: custom function hoặc xirr package

OPTION B – Python

FastAPI

pandas

openpyxl / xlrd

numpy / numpy-financial

3. Data Storage Design (CSV / Excel)
3.1 Folder Structure
data/
├── master/
│   ├── assets.csv
│   ├── platforms.csv
│   ├── strategies.csv
│
├── portfolios.csv
├── cash_accounts.csv
├── transactions.csv
├── snapshots.csv
│
├── backups/
│   └── 2025-01-01.zip

4. Data Model (CSV schema)
4.1 assets.csv
asset_id,asset_name,asset_type
A001,Stock,INVESTMENT
A002,Forex,INVESTMENT
A003,Gold,INVESTMENT
A004,Cash,CASH

4.2 platforms.csv
platform_id,platform_name,platform_type
P001,SSI,BROKER
P002,VPS Forex,BROKER
P003,VCB,BANK

4.3 strategies.csv
strategy_id,strategy_name,description
S001,Long Term,Buy and hold
S002,Mid Term,Swing trade
S003,DCA,Monthly investment

4.4 portfolios.csv
portfolio_id,name,asset_id,platform_id,strategy_id,start_date
PF001,Stock Mid Term,A001,P001,S002,2024-01-01
PF002,Stock Long Term,A001,P002,S003,2024-01-01

4.5 cash_accounts.csv
cash_account_id,name,platform_id,currency
C001,VCB Saving,P003,VND

4.6 transactions.csv
transaction_id,date,type,amount,portfolio_id,cash_account_id
T001,2024-01-05,DEPOSIT,10000000,PF001,C001
T002,2024-02-05,DEPOSIT,5000000,PF002,C001

4.7 snapshots.csv
snapshot_id,portfolio_id,date,nav
SNP001,PF001,2024-02-01,10800000
SNP002,PF001,2024-03-01,11200000

5. Business Logic & Calculations
5.1 Total Invested
SUM(transactions.amount WHERE type = DEPOSIT)

5.2 Current NAV

Lấy snapshot mới nhất theo portfolio

Hoặc nhập manual

5.3 Profit
Profit = Current NAV - Total Invested

5.4 XIRR (CỰC KỲ QUAN TRỌNG)
Input cho XIRR:

Cash flow:

Deposit → negative

Withdraw → positive

Current NAV → positive (ngày snapshot)

Ví dụ:
[
  { date: "2024-01-05", amount: -10000000 },
  { date: "2024-02-05", amount: -5000000 },
  { date: "2024-04-01", amount: 16000000 }
]


Backend tính XIRR rồi trả về frontend.

6. API Design (File-based)
6.1 Read APIs
GET /api/portfolios
GET /api/portfolio/:id
GET /api/cash-accounts
GET /api/dashboard

6.2 Write APIs
POST /api/transaction
POST /api/snapshot
POST /api/portfolio


📌 Mỗi write:

Read file → append row → save

Auto backup trước khi ghi

7. Concurrency & Safety
7.1 File Lock

Dùng mutex / lock file

Tránh ghi cùng lúc

7.2 Backup strategy

Backup mỗi lần write

Zip toàn bộ folder data/