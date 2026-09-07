# Nightasaur Cloudflare 部署設定
# ============================================

# --- Cloudflare Pages (React 前端) ---
# 1. 前往 https://dash.cloudflare.com
# 2. Workers & Pages → Create → Pages
# 3. Connect Git repo 或直接上傳
# 4. Build settings:
#    - Framework: Vite
#    - Build command: npm -w apps/web run build
#    - Build output directory: apps/web/dist
#    - Root directory: /
# 5. Environment variables:
#    VITE_API_URL=https://api.nightasaur.com

# --- Cloudflare Workers (Node.js 後端) ---
# 後端需要用 Workers 或轉用 Cloudflare Pages Functions
# 因為 Express 不直接跑在 Workers，建議用 Railway/Render

# --- DNS 設定 (買完網域後) ---
# Type  Name    Content              Proxy
# CNAME @       nightasaur.pages.dev  ✅ Proxied
# CNAME api     nightasaur-api.railway.app  ✅ Proxied
# CNAME www     nightasaur.pages.dev  ✅ Proxied

# SSL: Cloudflare 自動提供 (Full or Full Strict)