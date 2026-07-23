# Hướng dẫn Deploy — Dataset Builder

## Phân tích stack & database

### Kiến trúc thực tế

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | Build ra static files (~330KB JS gzip ~105KB) |
| Backend | FastAPI + asyncpg + SQLAlchemy 2.0 async | Python, chạy qua uvicorn |
| Database | PostgreSQL 16 | Auto-create tables lúc startup |
| Auth | JWT (HS256) trong localStorage | Stateless |
| API | `/api/v1/*` — axios gọi qua `VITE_API_BASE_URL` hoặc relative `/api/v1` | |

---

## Ước lượng dung lượng database

### Bảng cố định (seed data — không đổi)

| Bảng | Số dòng | ~Dung lượng |
|---|---|---|
| `question_groups` | 6 | < 5 KB |
| `question_subgroups` | 24 | < 20 KB |
| `subgroup_examples` | ~72 (3/subgroup) | < 50 KB |
| `expected_behavior_options` | 16 | < 10 KB |
| `review_status_options` | 4 | < 5 KB |
| **Tổng seed** | | **~90 KB** |

### Bảng dữ liệu người dùng nhập

**Scenario: 5 bác sĩ × 120 câu = 600 QaEntry**

| Bảng | Ước lượng dòng | ~Dung lượng |
|---|---|---|
| `users` | 5–20 bác sĩ + admin | < 50 KB |
| `qa_entries` | 600 dòng (Text fields ~500–2000 chars/dòng) | ~5–8 MB |
| `qa_citations` | ~1800 (avg 3/entry) | ~2 MB |
| `qa_citation_points` | ~5400 (avg 3/citation) | ~3 MB |
| `guideline_documents` | phụ thuộc corpus import | biến thiên |
| `guideline_chunks` | phụ thuộc corpus import (JSON/CSV) | biến thiên |

**Corpus guideline** là biến số lớn nhất:
- Nếu import 1 file JSON ~5000 chunks × 1KB/chunk → **~5 MB**
- Nếu import 10 tài liệu → **~50 MB**

**Tổng ước lượng thực tế: 20–80 MB** (PostgreSQL WAL + indexes ~2–3× raw data = **50–250 MB disk**)

> **Kết luận: Database rất nhỏ.** Free tier của hầu hết provider (Supabase, Railway, Render) đủ dùng cho mục đích này.

---

## Phương án deploy tối ưu — Railway (Khuyến nghị #1)

**Lý do chọn Railway:**
- Deploy được cả 3 thứ (Frontend static, FastAPI, PostgreSQL) trong **1 project**
- Tự detect Dockerfile, tự cấp domain HTTPS
- Free tier: $5/tháng credit (đủ cho project nội bộ nhỏ)
- Không cần cấu hình Nginx thủ công

### Bước 1 — Tạo Dockerfile cho backend

Tạo file `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Bước 2 — Cấu hình biến môi trường backend trên Railway

```
APP_ENV=production
DEBUG=false
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_USER=<railway-user>
DB_PASSWORD=<railway-password>
DB_NAME=railway
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
JWT_SECRET_KEY=<random-64-chars>
AUTO_CREATE_TABLES=true
SEED_TAXONOMY=true
DEFAULT_ADMIN_EMAIL=admin@benhvien.vn
DEFAULT_ADMIN_PASSWORD=<mat-khau-manh>
ALLOWED_ORIGINS=["https://<your-frontend-domain>"]
```

> [!CAUTION]
> `JWT_SECRET_KEY` phải là chuỗi random mạnh, KHÔNG dùng `change-this-secret`. Chạy: `python -c "import secrets; print(secrets.token_hex(32))"`

### Bước 3 — Build & deploy frontend

Frontend dùng **relative path** `/api/v1` nên cần **reverse proxy** để `/api/v1/*` → backend.

**Cách đơn giản nhất:** Dùng **Nginx** hoặc serve static + proxy bằng Railway:

Tạo `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://<backend-service-url>/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Tạo `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Phương án #2 — VPS (DigitalOcean / Vultr / Hetzner ~$6/tháng)

**Phù hợp nếu:** muốn kiểm soát hoàn toàn, data nhạy cảm (bệnh viện).

### Toàn bộ chạy bằng Docker Compose production

Tạo `docker-compose.prod.yml` ở root:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - internal

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      AUTO_CREATE_TABLES: "true"
      SEED_TAXONOMY: "true"
      ALLOWED_ORIGINS: '["https://${DOMAIN}"]'
      DEFAULT_ADMIN_EMAIL: ${ADMIN_EMAIL}
      DEFAULT_ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    depends_on:
      - postgres
    networks:
      - internal
      - web

  frontend:
    build: ./frontend
    restart: unless-stopped
    networks:
      - web

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/conf.d/default.conf
      - certbot-etc:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    depends_on:
      - frontend
      - backend
    networks:
      - web

volumes:
  pgdata:
  certbot-etc:
  certbot-www:

networks:
  internal:
  web:
```

### `nginx.prod.conf` (Nginx làm reverse proxy + HTTPS):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://frontend:80/;
        proxy_set_header Host $host;
    }
}
```

### Lệnh deploy trên VPS:

```bash
# 1. SSH vào VPS
ssh root@<your-vps-ip>

# 2. Cài Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone / copy code lên VPS
git clone <your-repo> /opt/dataset-builder
cd /opt/dataset-builder

# 4. Tạo .env
cp backend/.env.example .env
# Sửa .env: JWT_SECRET_KEY, DB_PASSWORD, ADMIN_PASSWORD, DOMAIN

# 5. Cấp HTTPS miễn phí (Let's Encrypt)
docker run --rm -v $(pwd)/certbot-etc:/etc/letsencrypt \
  -v $(pwd)/certbot-www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot -d your-domain.com --email you@email.com --agree-tos

# 6. Chạy
docker compose -f docker-compose.prod.yml up -d --build

# 7. Kiểm tra
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Phương án #3 — Render.com (Free tier, nhanh nhất)

> [!WARNING]
> Render free tier **sleep sau 15 phút không có request** → lần đầu truy cập chậm ~30s. Phù hợp demo, không phù hợp production thực sự.

1. **Backend**: New Web Service → chọn repo → Runtime: Docker → set env vars
2. **Database**: New PostgreSQL (free 1GB) → copy connection string → paste vào env backend
3. **Frontend**: New Static Site → Build command: `cd frontend && npm run build` → Publish dir: `frontend/dist`
4. Thêm Redirect Rule: `/api/*` → `https://<backend-url>/api/*` (301)

---

## So sánh các phương án

| Tiêu chí | Railway | VPS tự quản | Render |
|---|---|---|---|
| **Dễ setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Chi phí** | ~$5–10/tháng | ~$6–12/tháng | Free (demo) / $7+ |
| **Kiểm soát** | Trung bình | Cao nhất | Thấp |
| **HTTPS tự động** | ✅ | Tự cấu hình | ✅ |
| **Phù hợp dữ liệu y tế** | Trung bình | ✅ Tốt nhất | ❌ |
| **Uptime** | 99.9% | Tùy VPS | Free: sleep |

---

## Lưu ý bảo mật trước khi deploy

> [!CAUTION]
> **Bắt buộc phải làm** trước khi public:

1. **Đổi `JWT_SECRET_KEY`** — không bao giờ dùng giá trị mặc định
2. **Đổi `DEFAULT_ADMIN_PASSWORD`** — ngay sau lần đầu login
3. **`DEBUG=false`** trong production — tắt stack trace trả về client
4. **`ALLOWED_ORIGINS`** — chỉ cho phép đúng domain frontend của bạn, không dùng `["*"]`
5. **Không commit file `.env`** lên git — thêm vào `.gitignore`
6. **PostgreSQL không expose ra internet** — chỉ backend kết nối qua internal network

---

## Backup database

```bash
# Backup
docker exec <postgres-container> pg_dump -U golden golden_dataset > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i <postgres-container> psql -U golden golden_dataset < backup_20260723.sql
```

Nên đặt cronjob backup hàng ngày nếu dùng VPS.
