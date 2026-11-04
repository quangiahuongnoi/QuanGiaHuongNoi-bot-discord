# 🛡️ AegisBot — Discord Bot Đa Năng 24/7 & Trang Web Điều Khiển Trực Tiếp

Hệ thống **Discord Bot Full-Stack (Discord.js v14 + @discordjs/voice + React 19 + Express + Vite + Web Controller)** điều khiển bot Discord thật 100%, không sử dụng giả lập.

---

## 🚀 Tính Năng Đã Hoàn Thiện & Sửa Lỗi

1. **Loại bỏ 100% Mock & Giả lập**:
   - Đã gỡ bỏ toàn bộ module giả lập chat và âm thanh oscillator trình duyệt.
   - Toàn bộ hành động trên web đều gửi yêu cầu trực tiếp đến Discord Gateway và máy chủ Discord thật.

2. **Khắc phục triệt để Phát Nhạc Voice (`@discordjs/voice` + Node Streams)**:
   - Sửa lỗi crash `ENOENT` khi truyền URL âm thanh từ web vào `@discordjs/voice`.
   - Sử dụng cơ chế Fetch Stream `Readable.fromWeb` kết hợp `StreamType.Arbitrary`, hỗ trợ phát nhạc ổn định qua lệnh hoặc từ bảng điều khiển web.
   - Các lệnh: `!play <url/tên>`, `!pause`, `!skip`, `!queue`, `!volume <1-100>`.

3. **Hệ Thống Lệnh Slash (/) & Text Commands Đầy Đủ**:
   - Tự động đăng ký Slash Commands: `/ping`, `/help`, `/play`, `/pause`, `/skip`, `/queue`, `/rank`, `/leaderboard`.
   - Lệnh kiểm duyệt thực tế:
     - `!clear <số_lượng>`: Xóa hàng loạt tin nhắn.
     - `!kick <@user> [lý do]`: Trục xuất thành viên khỏi server.
     - `!ban <@user> [lý do]`: Cấm vĩnh viễn thành viên.
     - `!mute <@user> [phút] [lý do]`: Đưa vào phòng cách ly (Timeout Discord).
     - `!unmute <@user>`: Mở khóa cách ly.
     - `!slowmode <giây>`: Bật chế độ làm chậm trong kênh.
     - `!lock` & `!unlock`: Khóa / Mở kênh chat.
     - `!poll <câu hỏi>`: Tạo bình chọn với phản ứng 👍 / 👎.
     - `!autorole`: Gửi bảng chọn vai trò bằng các nút bấm Discord (Button Components).

4. **Hệ Thống Điểm Kinh Nghiệm (XP & Leveling) Thật**:
   - Lưu trữ tiến độ XP, số lượng tin nhắn, cấp độ người dùng theo thời gian thực.
   - Thông báo chúc mừng khi lên cấp kèm tự động cấp vai trò (Level Roles).
   - Lệnh `!rank` hiển thị thẻ kinh nghiệm, `!leaderboard` hiển thị bảng xếp hạng thành viên hoạt động sôi nổi nhất.

5. **Nút Bấm Nhận Vai Trò (Button Reaction Roles)**:
   - Sử dụng Discord ActionRow & ButtonBuilder v14.
   - Thành viên chỉ cần bấm nút để nhận hoặc hủy vai trò tức thì mà không cần cấp quyền quản trị.

---

## 🌐 2 Giao Diện Điều Khiển Web Độc Đáo

Dự án cung cấp **2 giao diện web** để bạn quản lý bot thuận tiện nhất:

### 1. Trang Web Điều Khiển Độc Lập Siêu Tốc (`/control`):
- Đường dẫn: `http://localhost:3000/control` (hoặc mở trực tiếp file [public/control.html](http://localhost:3000/control) trên trình duyệt).
- **Tính năng trên trang web**:
  - Nhập và lưu Token Bot Discord ngay trên giao diện web (không cần sửa code).
  - Chọn máy chủ Discord đang kết nối và xem danh sách kênh Text / Voice.
  - Điều khiển âm nhạc phòng Voice: Phát nhạc từ link, Pause, Resume, Stop.
  - Gửi tin nhắn hoặc tạo Rich Embed chuyên nghiệp gửi ngay vào bất kỳ kênh nào.
  - Quản trị viên: Kick, Ban, Timeout thành viên theo User ID ngay trên web.
  - Đăng bảng nút bấm tự cấp vai trò (Reaction Buttons) vào kênh chỉ với 1 click.
  - Dọn dẹp tin nhắn kênh.
  - Xem nhật ký hoạt động (Audit Logs) trực tiếp.

### 2. Trang Quản Trị React Full-Stack (`/`):
- Đường dẫn: `http://localhost:3000`
- Giao diện chi tiết với các tab: Tổng Quan Server, Bộ Lọc Tự Động (Auto-Mod), Trình Phát Nhạc Hi-Fi, Phản Hồi Tự Động (Auto-Responder), Thông Báo Mạng Xã Hội (YouTube/TikTok), Phân Tích Dữ Liệu & Bảng Xếp Hạng XP.

---

## ⚙️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Yêu cầu môi trường
- Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên, khuyến nghị v20+).
- *(Tùy chọn)* [FFmpeg](https://ffmpeg.org/) nếu muốn giải mã nhạc chất lượng cao trên máy tính.

### Bước 2: Cài đặt thư viện dependencies
Mở Terminal / PowerShell tại thư mục dự án và chạy:
```bash
npm install
```

### Bước 3: Cấu hình Discord Bot Token
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications).
2. Tạo mới một Application (hoặc chọn con Bot hiện tại của bạn).
3. Vào tab **Bot**:
   - Nhấn **Reset Token** để lấy chuỗi Token Bot.
   - Kéo xuống mục **Privileged Gateway Intents** và **BẬT BẮT BUỘC cả 3 quyền sau**:
     - ✅ `PRESENCE INTENT`
     - ✅ `SERVER MEMBERS INTENT`
     - ✅ `MESSAGE CONTENT INTENT`
4. Vào tab **OAuth2** -> **URL Generator**:
   - Chọn scope: `bot`, `applications.commands`
   - Chọn Bot Permissions: `Administrator` (hoặc các quyền gửi tin nhắn, quản lý vai trò, kết nối voice).
   - Sao chép đường link được tạo và dán vào trình duyệt để mời bot vào máy chủ Discord của bạn.
5. Cấu hình Token vào file `.env` (hoặc nhập trực tiếp trên trang web điều khiển):
```env
DISCORD_BOT_TOKEN="token_bot_cua_ban_tai_day"
DISCORD_CLIENT_ID="application_id_cua_ban"
PORT=3000
```

### Bước 4: Khởi chạy Bot
```bash
npm run dev
```

Sau khi chạy thành công, console sẽ thông báo:
```
🚀 AegisBot Full-Stack Server running on http://localhost:3000
Logged in as YourBotName#1234
✅ Đã đồng bộ danh sách máy chủ: 1 máy chủ
✅ Đã đăng ký Slash Commands (/) toàn cục
```

Mở trình duyệt:
- Điều khiển trực tiếp: `http://localhost:3000/control`
- Toàn bộ bảng quản trị: `http://localhost:3000`

---

## 🐳 Triển Khai Chạy 24/7 Bằng Docker (Tùy chọn)

Nếu bạn muốn chạy bot liên tục trên VPS hoặc Docker Desktop:
```bash
# Build image
docker build -t aegis-discord-bot .

# Chạy container nền
docker run -d -p 3000:3000 --env-file .env --name aegisbot --restart always aegis-discord-bot
```
Endpoint kiểm tra tình trạng kết nối: `http://localhost:3000/api/health`.


## 🔐 Admin Login (Web Control Panel)

Trang điều khiển bot hiện yêu cầu đăng nhập Admin trước khi truy cập các API `/api/bot/*`.

Thêm vào file `.env`:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="mat-khau-manh-cua-ban"
SESSION_SECRET="mot-chuoi-bi-mat-dai-it-nhat-32-ky-tu"
```

Sau đó khởi động lại server:

```bash
npm install
npm run dev
```

Mở `http://localhost:3000/control` hoặc URL của dashboard. Phiên đăng nhập có thời hạn 8 giờ và dùng cookie `HttpOnly`. Endpoint `/api/health` vẫn mở để health-check, còn các API điều khiển bot yêu cầu đăng nhập.

> Không đưa file `.env` lên GitHub. File `.gitignore` đã bỏ qua `.env*`.


## 📡 YouTube / TikTok Live Monitor

Phân hệ Social hiện có **polling thật ở backend**, không còn chỉ là nút Test:

- YouTube: đọc RSS của kênh để phát hiện video mới; phát hiện Live bằng YouTube Data API nếu có `YOUTUBE_API_KEY`, nếu không sẽ dùng trang `/live` làm fallback.
- TikTok: kiểm tra public Live page của tài khoản và phát hiện chuyển trạng thái `offline → live`.
- Chỉ gửi thông báo khi có **sự kiện mới**; lần kiểm tra đầu tiên dùng làm mốc để tránh spam sau khi restart.
- Có nút **Kiểm tra ngay** trên dashboard để chạy poll thủ công.
- Có thể chọn **kênh Discord** và **role ping** trực tiếp khi thêm feed.
- Khoảng kiểm tra mặc định: 60 giây. Có thể chỉnh trong `.env`.

Thêm vào `.env`:

```env
SOCIAL_MONITOR_ENABLED="true"
SOCIAL_MONITOR_INTERVAL_MS="60000"
YOUTUBE_API_KEY=""
SOCIAL_FALLBACK_CHANNEL_ID=""
```

> Khuyến nghị tạo YouTube Data API v3 key nếu bạn muốn phát hiện livestream YouTube ổn định hơn. Không commit API key vào GitHub.

Nếu dependency của project báo xung đột `opusscript` / `prism-media`, cài bằng:

```bash
npm install --legacy-peer-deps
```
