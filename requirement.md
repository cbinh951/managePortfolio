# BUSINESS REQUIREMENT DOCUMENT  
## PERSONAL ASSET MANAGEMENT WEB APP (WITH CASH)

---

## 1. Mục tiêu hệ thống (Business Objectives)

Hệ thống giúp người dùng:

- Quản lý **toàn bộ tài sản cá nhân**, bao gồm:
  - Tài sản đầu tư (chứng khoán, forex, vàng)
  - **Tiền mặt hiện có**
- Theo dõi **dòng tiền thực tế** giữa tiền mặt và đầu tư
- Nhập và theo dõi **giá trị tài sản (NAV)** theo thời gian
- So sánh:
  - Tổng vốn đầu tư
  - Giá trị hiện tại
  - Lợi nhuận hiện tại
  - Tỷ trọng tiền mặt vs đầu tư
- Biết chính xác **Net Worth (Tổng tài sản ròng)** tại mọi thời điểm

---

## 2. Đối tượng sử dụng (Target Users)

- Cá nhân đầu tư đa kênh
- Người muốn quản lý:
  - Dòng tiền
  - Danh mục đầu tư
  - Tiền mặt nhàn rỗi

---

## 3. Phạm vi hệ thống (Scope)

### 3.1 In Scope (Phase 1)

- Web App cho 1 user
- Nhập liệu thủ công
- Quản lý:
  - Asset
  - Platform
  - Strategy
  - Portfolio
  - **Cash Account**
- Transaction
- Snapshot (NAV)
- Dashboard & báo cáo

---

### 3.2 Out of Scope (Phase sau)

- Tự động sync ngân hàng
- AI gợi ý phân bổ tài sản
- Multi-user

---

## 4. Định nghĩa nghiệp vụ (Business Definitions)

---

### 4.1 Asset

Loại tài sản:
- `STOCK`
- `FOREX`
- `GOLD`
- `CASH`

---

### 4.2 Cash Account (Tài khoản tiền mặt)

Đại diện cho tiền mặt hiện có:
- Tiền ngân hàng
- Tiền ví điện tử
- Tiền mặt vật lý

**Cash Account KHÔNG có NAV biến động**, giá trị = số dư.

---

### 4.3 Platform / Broker

- Sàn chứng khoán
- Sàn forex
- Ngân hàng
- Ví điện tử

---

### 4.4 Strategy

- Trung hạn
- Dài hạn
- DCA
- **Holding (cho Cash)**

---

### 4.5 Portfolio

**Portfolio là đơn vị quản lý tài chính độc lập**

Một Portfolio =  
**Asset + Platform + Strategy**

Ví dụ:
- CK – Trung hạn – Sàn A
- Vàng – DCA – Vàng vật chất
- **Cash – Holding – Ngân hàng A**

---

### 4.6 Transaction

Đại diện cho **dòng tiền thật**.

Các loại:
- `DEPOSIT`
- `WITHDRAW`
- `TRANSFER` (giữa Cash ↔ Investment)
- `BUY`
- `SELL`
- `FEE`

---

### 4.7 Portfolio Snapshot (NAV)

- Áp dụng cho **Investment Portfolio**
- Không áp dụng cho Cash
- Dùng để theo dõi giá trị theo thời gian

---

## 5. Business Rules

---

### BR-01: Cash là tài sản gốc

- Tiền mặt là **nguồn tiền** để đầu tư
- Mọi dòng tiền đầu tư phải đi **từ Cash Account**

---

### BR-02: Portfolio là ranh giới tài chính

- Không trộn dòng tiền giữa các Portfolio
- Cash Portfolio cũng là một Portfolio độc lập

---

### BR-03: Quy ước dấu tiền

- Dòng tiền đi ra: Amount âm
- Dòng tiền đi vào: Amount dương

---

### BR-04: Transfer giữa Cash và Investment

- Chuyển tiền:
  - Cash: Amount âm
  - Investment: Amount âm (nạp vốn)
- Rút tiền:
  - Investment: Amount dương
  - Cash: Amount dương

---

### BR-05: Snapshot không phải dòng tiền

- Snapshot chỉ phản ánh NAV
- Không ảnh hưởng đến cashflow

---

### BR-06: Hai loại lợi nhuận

| Loại | Áp dụng |
|----|--------|
| Lợi nhuận hiện tại | Investment Portfolio |
| XIRR | Investment Portfolio |
| Số dư | Cash Portfolio |

---

### BR-07: Net Worth

Net Worth = Total Cash + Total Investment NAV

---

### BR-08: Quản lý vàng vật chất (Physical Gold Portfolio)

**Use Case**: Khi tạo Portfolio về vàng vật chất

#### Loại vàng:
- **Vàng thương hiệu** (Branded Gold): Vàng SJC, PNJ, DOJI, etc.
- **Vàng tư nhân** (Private/Physical Gold): Vàng miếng, vàng nhẫn tư nhân

#### Transaction (Mua/Bán vàng):
Khi thêm transaction cho vàng vật chất, cần nhập:
- **Loại vàng**: Dropdown chọn `Vàng thương hiệu` hoặc `Vàng tư nhân`
- **Số lượng**: Dropdown/Input cho số **"chỉ"** (đơn vị đo vàng Việt Nam, 1 chỉ = 3.75g)
- **Giá tiền**: Tổng số tiền giao dịch (VND)
- **Ngày giao dịch**: Date

#### Snapshot (Giá vàng hiện tại):
Khi nhập snapshot giá vàng tại một thời điểm:
- **Giá vàng thương hiệu**: Giá của **1 chỉ** vàng thương hiệu tại thời điểm đó (VND/chỉ)
- **Giá vàng tư nhân**: Giá của **1 chỉ** vàng tư nhân tại thời điểm đó (VND/chỉ)
- **Ngày snapshot**: Date

*Lưu ý: Snapshot chỉ lưu giá đơn vị (1 chỉ), KHÔNG lưu tổng giá trị*

#### Tính lợi nhuận (P&L):
```
Tổng số chỉ đã mua = Sum(số chỉ từ các transaction MUA)
Tổng số chỉ hiện có = Tổng số chỉ đã mua - Sum(số chỉ từ các transaction BÁN)

NAV hiện tại = Tổng số chỉ hiện có × Giá hiện tại (theo loại vàng)

P&L = NAV hiện tại - Tổng vốn đầu tư
```

*Lưu ý: Khi tính P&L, cần tách riêng cho từng loại vàng (thương hiệu/tư nhân) vì giá khác nhau*


---

## 6. Luồng nghiệp vụ chính

---

### 6.1 Quản lý Cash

- Tạo Cash Portfolio (Ngân hàng / Ví)
- Nhập:
  - Thu nhập
  - Chi tiêu
  - Chuyển tiền đầu tư

---

### 6.2 Đầu tư

- Chuyển tiền từ Cash → Investment
- Nhập Transaction đầu tư
- Nhập Snapshot NAV

---

### 6.3 Tính toán tại thời điểm bất kỳ

Cash Balance = Sum(Transaction of Cash)
Investment NAV = Latest Snapshot
Net Worth = Cash + Investment NAV


---

## 7. Dashboard & Báo cáo

---

### 7.1 Tổng quan

- Total Net Worth
- Total Cash
- Total Investment NAV
- Allocation (% Cash vs Investment)

---

### 7.2 Theo Portfolio

- Cash:
  - Số dư
- Investment:
  - NAV
  - Profit
  - XIRR

---

### 7.3 Theo thời gian

- Net Worth over time
- Cash vs Investment chart

---

## 8. KPI thành công

- Biết **tổng tài sản ròng**
- Kiểm soát được tiền mặt
- Ra quyết định phân bổ vốn tốt hơn

---

## 9. Phi chức năng

- Chính xác tài chính
- Audit log
- Backup

---

## 10. Roadmap

### Phase 1
- Cash + Investment manual input
- Snapshot
- XIRR

### Phase 2
- Import CSV
- Auto price

### Phase 3
- Bank sync
- Asset allocation analysis

---

# DANH SÁCH MÀN HÌNH (UPDATED WITH CASH)

---

## A. Core Screens

1. **Dashboard (Net Worth Overview)**
2. Portfolio List
3. Portfolio Detail
4. Transaction Management
5. Snapshot (NAV) Management

---

## B. Cash Management

6. **Cash Account List**
7. **Cash Account Detail**
8. **Cash Transfer (Cash ↔ Investment)**

---

## C. Management

9. Asset Management
10. Platform Management
11. Strategy Management

---

## D. Analytics & Report

12. Performance Analysis
13. Asset Allocation (Cash vs Investment)
14. Comparison (Asset / Strategy / Platform)

---

## E. System

15. Settings
16. Audit Log (Optional)

---

## Giá trị cốt lõi sau khi thêm Cash

- Quản lý **toàn bộ tài sản thật**
- Biết chính xác **tiền ở đâu – đầu tư bao nhiêu**
- Ra quyết định phân bổ vốn dựa trên dữ liệu
