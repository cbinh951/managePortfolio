1. Mục tiêu (Objective)

Module Portfolio Performance nhằm:

Đánh giá hiệu suất đầu tư thực tế của một portfolio

Cho phép nhà đầu tư:

Nạp tiền

Rút tiền (toàn phần / một phần)

Theo dõi tăng trưởng tài sản

Đảm bảo:

Rút tiền không bị hiểu nhầm là lỗ

Biểu đồ phản ánh đúng hiệu suất

XIRR luôn chính xác

2. Phạm vi (Scope)

Áp dụng cho:

Portfolio chứng khoán

Portfolio vàng

Portfolio forex / crypto

Portfolio tổng hợp

Không áp dụng cho:

Phân tích lãi lỗ theo từng mã tài sản

Asset allocation chi tiết

3. Mô hình dữ liệu nền tảng (Data Model Assumption)

Hệ thống KHÔNG lưu:

Mã chứng khoán

Holdings chi tiết

Giá từng tài sản

Hệ thống CHỈ lưu:

Transaction (Cash Flow)

Snapshot (NAV theo thời gian)

4. Định nghĩa thuật ngữ (Definitions)
Thuật ngữ	Định nghĩa
Cash In	Tiền nạp vào portfolio
Cash Out	Tiền rút ra khỏi portfolio
NAV	Tổng giá trị portfolio tại thời điểm snapshot
Total Withdrawn	Tổng tiền đã rút ra khỏi portfolio
Total Equity	Tổng tài sản đã và đang sở hữu
Snapshot	Bản ghi NAV tại một thời điểm
XIRR	Tỷ suất lợi nhuận nội bộ dựa trên dòng tiền
5. Nguyên tắc business cốt lõi (Business Principles)
5.1 Rút tiền KHÔNG phải là lỗ

Cash Out là kết quả đầu tư

Không được làm giảm performance

5.2 NAV KHÔNG đại diện cho hiệu suất

NAV chỉ phản ánh giá trị còn lại trong portfolio

5.3 Hiệu suất phải dựa trên Total Equity

Performance = tài sản đã rút + tài sản còn lại

5.4 XIRR chỉ dựa trên Cash Flow + NAV hiện tại

Không phụ thuộc asset detail

6. Transaction Requirements
6.1 Transaction Types
Type	Ý nghĩa
Cash In	Nạp tiền
Cash Out	Rút tiền
Adjustment	Điều chỉnh (optional)
6.2 Transaction Fields
Field	Bắt buộc	Mô tả
Date	✅	Ngày giao dịch
Type	✅	Cash In / Cash Out
Amount	✅	Giá trị (+/-)
Note	❌	Ghi chú
6.3 Business Rules – Transaction

Cash In:

Amount > 0

Cash Out:

Amount > 0

Không được xóa transaction đã ảnh hưởng đến snapshot lịch sử

7. Snapshot Requirements
7.1 Snapshot Fields
Field	Bắt buộc	Mô tả
Date	✅	Ngày snapshot
NAV	✅	Tổng giá trị portfolio
Note	❌	Ghi chú (vd: chốt lời)
7.2 Snapshot Rules

Snapshot là immutable

Không được sửa snapshot quá khứ

Snapshot phản ánh giá trị tại thời điểm đó

8. Các chỉ số tính toán (Key Calculations)
8.1 Total Invested
Total Invested = Σ Cash In

8.2 Total Withdrawn
Total Withdrawn = Σ Cash Out

8.3 Current NAV
Current NAV = NAV của snapshot mới nhất

8.4 Total Equity (CHỈ SỐ CHUẨN)
Total Equity = Current NAV + Total Withdrawn


Total Equity là chỉ số dùng để đánh giá hiệu suất

8.5 Total Profit
Total Profit = Total Equity - Total Invested

8.6 XIRR

Dòng tiền XIRR:

- Cash In (âm)
+ Cash Out (dương)
+ Current NAV (dương, tại ngày hiện tại)

9. Use Case chuẩn: Rút tiền sau khi chốt lời
9.1 Tình huống

Tổng nạp: 100,000,000

Snapshot trước:

NAV = 120,000,000

Rút tiền: 30,000,000

9.2 Ghi nhận dữ liệu
Transaction
Cash Out: 30,000,000

Snapshot
NAV: 90,000,000

9.3 Kết quả tính toán
Chỉ số	Giá trị
Total Invested	100,000,000
Total Withdrawn	30,000,000
Current NAV	90,000,000
Total Equity	120,000,000
Total Profit	+20,000,000

👉 Không có lỗ

10. Biểu đồ & hiển thị (Visualization Requirements)
10.1 Biểu đồ hiệu suất

❌ Không được dùng:

NAV

✅ Phải dùng:

Total Equity

10.2 Dữ liệu cho chart
Date	NAV	Total Withdrawn	Total Equity
T1	120	0	120
T2	90	30	120
10.3 Tooltip bắt buộc

“Hiệu suất được tính dựa trên tổng tài sản đã và đang sở hữu (NAV + tiền đã rút).
Việc rút tiền không làm giảm hiệu suất đầu tư.”

11. Yêu cầu phi chức năng (Non-Functional)

Calculation phải nhất quán giữa UI, export và API

Không cho phép chỉnh sửa lịch sử gây thay đổi XIRR

Snapshot và Transaction phải audit được