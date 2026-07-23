# Deploy lên Railway — Hướng dẫn từng bước

> **Database online hoàn toàn** — Railway PostgreSQL lưu dữ liệu trên cloud, không tốn RAM/disk máy bạn.

---

## Tổng quan kiến trúc trên Railway

```
Railway Project
├── Service: postgres      ← PostgreSQL managed (online, không phải local)
├── Service: backend       ← FastAPI (Dockerfile)
└── Service: frontend      ← React static (Dockerfile + Nginx)
```

HTTPS tự động. Mỗi service có domain riêng (hoặc custom domain).

---

## Bước 0 — Chuẩn bị code

### Tạo `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Tạo `frontend/nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://$BACKEND_HOST/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> [!IMPORTANT]
> Vì frontend dùng relative path `/api/v1`, Nginx sẽ proxy request `/api/*` sang backend URL.
> `$BACKEND_HOST` sẽ được thay bằng Railway internal URL (xem Bước 3).

### Tạo `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Thêm `.gitignore` cho backend (nếu chưa có)

```
.env
.venv/
__pycache__/
*.pyc
```

---

## Bước 1 — Tạo tài khoản Railway

1. Vào [railway.app](https://railway.app) → **Login with GitHub**
2. Tạo **New Project** → **Empty Project**

---

## Bước 2 — Thêm PostgreSQL (Database online)

1. Trong project → **+ Add Service** → chọn **Database** → **PostgreSQL**
2. Railway tạo ngay một PostgreSQL instance trên cloud
3. Click vào service **postgres** → tab **Variables** → copy các giá trị:
   - `PGHOST` → dùng làm `DB_HOST`
   - `PGPORT` → dùng làm `DB_PORT`  
   - `PGUSER` → dùng làm `DB_USER`
   - `PGPASSWORD` → dùng làm `DB_PASSWORD`
   - `PGDATABASE` → dùng làm `DB_NAME`

> [!TIP]
> Railway cũng cấp `DATABASE_URL` là connection string đầy đủ. Bạn có thể dùng biến này thay vì từng biến riêng (cần sửa nhỏ trong `config.py`).

---

## Bước 3 — Deploy Backend

1. **+ Add Service** → **GitHub Repo** → chọn repo → chọn folder **`backend/`**
2. Railway tự detect `Dockerfile` và build

### Cấu hình Variables cho backend service:

| Tên biến | Giá trị |
|---|---|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `DB_HOST` | *(copy từ postgres service `PGHOST`)* |
| `DB_PORT` | `5432` |
| `DB_USER` | *(copy `PGUSER`)* |
| `DB_PASSWORD` | *(copy `PGPASSWORD`)* |
| `DB_NAME` | *(copy `PGDATABASE`)* |
| `DB_POOL_SIZE` | `3` |
| `DB_MAX_OVERFLOW` | `7` |
| `JWT_SECRET_KEY` | *(chuỗi random 64 ký tự — xem bên dưới)* |
| `AUTO_CREATE_TABLES` | `true` |
| `SEED_TAXONOMY` | `true` |
| `DEFAULT_ADMIN_EMAIL` | `admin@benhvien.vn` |
| `DEFAULT_ADMIN_PASSWORD` | *(mật khẩu mạnh của bạn)* |
| `DEFAULT_ADMIN_FULL_NAME` | `System Admin` |
| `ALLOWED_ORIGINS` | `["https://<frontend-domain>.railway.app"]` |

**Tạo JWT_SECRET_KEY ngẫu nhiên:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

3. Sau khi deploy → tab **Settings** → **Public Networking** → Railway cấp domain dạng `xxx.railway.app`
4. Copy domain này (ví dụ: `backend-xxx.railway.app`) → dùng ở Bước 4

---

## Bước 4 — Deploy Frontend

1. **+ Add Service** → **GitHub Repo** → chọn folder **`frontend/`**
2. Railway tự detect `Dockerfile`

### Cửa sổ nginx.conf — thay `$BACKEND_HOST`:

Mở `frontend/nginx.conf`, sửa dòng `proxy_pass`:
```nginx
proxy_pass https://backend-xxx.railway.app/api/;
```
*(thay `backend-xxx.railway.app` bằng domain backend từ Bước 3)*

> [!NOTE]
> Thay vì hardcode, bạn có thể dùng Railway's **internal networking**: các service cùng project có thể giao tiếp qua `http://<service-name>.railway.internal:port`. Không cần HTTPS nội bộ, nhanh hơn và miễn phí.

Ví dụ với internal networking:
```nginx
proxy_pass http://backend.railway.internal:8000/api/;
```

3. Sau deploy → tab **Settings** → **Public Networking** → Railway cấp domain frontend
4. Cập nhật `ALLOWED_ORIGINS` trong backend với domain frontend mới này

---

## Bước 5 — Kiểm tra

1. Mở `https://<frontend-domain>.railway.app` → trang đăng nhập
2. Đăng nhập với `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`
3. Vào Admin → thấy 0 bác sĩ → OK (seed chạy thành công)
4. Sau khi verify → vào **backend Variables** → đặt `SEED_TAXONOMY=false` để tắt seed khi restart

---

## Chi phí Railway (tháng 7/2026)

| Tier | Giá | Giới hạn |
|---|---|---|
| **Hobby** (khuyến nghị) | $5/tháng credit miễn phí | 512MB RAM, 1GB disk DB |
| **Pro** | $20/tháng | 8GB RAM, 100GB disk |

Project này dùng < 256MB RAM và < 100MB DB → **Hobby tier đủ dùng, có thể miễn phí hoàn toàn** nếu dùng ít.

---

## Câu hỏi về database online

### Railway PostgreSQL có mất dữ liệu không?
Không — Railway backup PostgreSQL tự động. Dữ liệu lưu trên AWS us-west-2 (mặc định) hoặc có thể chọn region khác.

### Làm sao truy cập DB để xem/sửa trực tiếp?
Railway cung cấp **Connect** tab → copy `DATABASE_URL` → dùng với DBeaver, TablePlus, pgAdmin để kết nối từ máy tính mà không cần chạy Docker local.

### Backup thủ công:
```bash
# Chạy trên máy bạn, không cần local Postgres
pg_dump "postgresql://user:pass@host:port/dbname" > backup.sql
```

---

## Tóm tắt file cần tạo/thêm

```
web for doctor/
├── backend/
│   └── Dockerfile          ← [MỚI]
└── frontend/
    ├── Dockerfile          ← [MỚI]
    └── nginx.conf          ← [MỚI]
```

Sau khi tạo 3 file này, push lên GitHub → Railway tự build và deploy.
