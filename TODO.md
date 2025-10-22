# GCP 專案搬家 TODO

**目標**: 從 `career-creator-472207` 搬到 `career-creator-card`

---

## ✅ 已完成 Checklist

- [x] 啟用新專案 APIs
  - [x] Cloud Run API
  - [x] Container Registry API
  - [x] Cloud Build API
  - [x] Artifact Registry API
  - [x] IAM Credentials API
  - [x] STS API

- [x] 設定 GCP 權限
  - [x] `dev02@careercreator.tw` 獲得 Editor 權限
  - [x] `dev02@careercreator.tw` 獲得 Project IAM Admin 權限
  - [x] `dev02@careercreator.tw` 獲得 Workload Identity Pool Admin 權限

- [x] 建立 Service Account
  - [x] Service Account `github-actions@career-creator-card` 已建立
  - [x] 授予 Cloud Run Admin 權限
  - [x] 授予 Storage Admin 權限
  - [x] 授予 Service Account User 權限

- [x] 更新程式碼
  - [x] `.github/workflows/deploy-backend.yaml` - PROJECT_ID 改為 career-creator-card
  - [x] `.github/workflows/deploy-frontend.yaml` - PROJECT_ID 改為 career-creator-card
  - [x] `.github/workflows/deploy-all.yaml` - PROJECT_ID 改為 career-creator-card
  - [x] `.github/workflows/artifact-cleanup.yml` - PROJECT_ID + image paths 改為 career-creator-card
  - [x] `CLAUDE.md` - 文件更新專案名稱

- [x] Commit 並 Push
  - [x] git commit 完成
  - [x] git push 到 staging

---

## ❌ 未完成 Checklist

- [ ] **等待 IT 解除組織政策限制** ⭐️ 必須先完成
- [ ] 產生 Service Account 金鑰 JSON
- [ ] 更新 GitHub Secret `GCP_SA_KEY`
- [ ] 觸發部署到新專案
- [ ] 驗證 Backend 服務運作正常
- [ ] 驗證 Frontend 服務運作正常
- [ ] 測試完整流程（登入、建立房間等）
- [ ] 清理舊專案資源（可選）

---

## ⏳ 等待 IT 完成

### 需要 IT 解除組織政策限制

### 請 IT 執行以下指令

```bash
gcloud resource-manager org-policies disable-enforce \
  constraints/iam.disableServiceAccountKeyCreation \
  --project=career-creator-card
```

### 或在 GCP Console 操作

1. 進入 <https://console.cloud.google.com>
2. 選擇專案：`career-creator-card`
3. IAM & Admin → Organization Policies
4. 搜尋：`Disable service account key creation`
5. 點 **Edit Policy**
6. 選擇 **Override parent's policy**
7. Policy enforcement 選：**Not enforced**
8. Save

---

## 📋 明天要做的事

### 步驟 1: IT 完成後，產生 Service Account 金鑰

```bash
# 切換到正確的專案和帳號
gcloud config set account dev02@careercreator.tw
gcloud config set project career-creator-card

# 產生金鑰
gcloud iam service-accounts keys create ~/gcp-sa-key-career-creator.json \
  --iam-account=github-actions@career-creator-card.iam.gserviceaccount.com \
  --project=career-creator-card

# 顯示金鑰內容
cat ~/gcp-sa-key-career-creator.json
```

### 步驟 2: 更新 GitHub Secret

1. 去 GitHub: <https://github.com/Youngger9765/career-creator/settings/secrets/actions>
2. 找到 `GCP_SA_KEY`
3. 點 **Update**
4. 貼上整個 JSON 內容（從步驟 1 的 cat 指令輸出）
5. **Save**

### 步驟 3: Commit 並部署

```bash
# 檢查修改內容
git status
git diff

# Commit
git add .github/workflows/ CLAUDE.md
git commit -m "chore: migrate GCP project to career-creator-card"

# Push
git push origin staging
```

### 步驟 4: 驗證部署

部署會自動觸發，等待約 5-10 分鐘後檢查：

```bash
# 查看服務列表
gcloud run services list --project=career-creator-card

# 檢查服務 URL
gcloud run services describe career-creator-backend-staging \
  --region=asia-east1 \
  --project=career-creator-card \
  --format="value(status.url)"

gcloud run services describe career-creator-frontend-staging \
  --region=asia-east1 \
  --project=career-creator-card \
  --format="value(status.url)"
```

---

## 📝 注意事項

1. **Database 不用搬**
   - 使用 Supabase，不在 GCP 上
   - DATABASE_URL、SUPABASE_URL 等 secrets 不用改

2. **GitHub Secrets 只需更新 1 個**
   - `GCP_SA_KEY` → 新的 JSON 金鑰內容

3. **舊專案清理**（可選，等新專案穩定後再做）

   ```bash
   # 切換到舊專案
   gcloud config set project career-creator-472207

   # 列出資源
   gcloud run services list
   gcloud container images list

   # 刪除服務（確認後再執行）
   gcloud run services delete career-creator-backend-staging --region=asia-east1
   gcloud run services delete career-creator-frontend-staging --region=asia-east1
   ```

---

## ❓ 如果遇到問題

### 問題 1: 金鑰產生失敗

**錯誤**: `Key creation is not allowed on this service account`

**解決**: IT 還沒解除限制，回到「等待 IT 完成」步驟

### 問題 2: 部署失敗 - 權限錯誤

**錯誤**: `Permission denied`

**解決**: 檢查 Service Account 權限是否正確：

```bash
gcloud projects get-iam-policy career-creator-card \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@career-creator-card.iam.gserviceaccount.com"
```

### 問題 3: GitHub Actions 部署失敗

**錯誤**: `authentication failed`

**解決**:

1. 確認 GitHub Secret `GCP_SA_KEY` 已更新
2. 確認 JSON 格式完整（有 `{` 開頭和 `}` 結尾）
3. 重新 trigger workflow

---

**更新時間**: 2025-10-22
**負責人**: <dev02@careercreator.tw>
