#!/bin/bash

# 監控 Artifact Registry 成本腳本
# 使用方法: ./monitor_artifact_costs.sh

PROJECT_ID="career-creator-472207"
REGION="us"
REPOSITORY="gcr.io"

echo "🔍 Career Creator - Artifact Registry 成本監控"
echo "=============================================="

# 檢查 repository 大小
SIZE_BYTES=$(gcloud artifacts repositories describe $REPOSITORY \
  --location=$REGION \
  --project=$PROJECT_ID \
  --format="get(sizeBytes)" 2>/dev/null || echo "0")

# 轉換為 MB (處理空值)
if [ "$SIZE_BYTES" = "0" ] || [ -z "$SIZE_BYTES" ]; then
  SIZE_MB="0"
  COST_USD="0.00"
  COST_TWD="0"
else
  SIZE_MB=$(echo "scale=1; $SIZE_BYTES / 1024 / 1024" | bc 2>/dev/null || echo "0")
  # 估算月費用 (Artifact Registry 約 $0.10/GB/month)
  COST_USD=$(echo "scale=2; $SIZE_MB * 0.10 / 1024" | bc 2>/dev/null || echo "0.00")
  COST_TWD=$(echo "scale=0; $COST_USD * 31" | bc 2>/dev/null || echo "0")  # 約31 TWD/USD
fi

echo "📊 Repository: $REPOSITORY"
echo "📦 大小: ${SIZE_MB}MB"
echo "💰 估算月費用: \$${COST_USD} USD (約 TWD $${COST_TWD})"

# 檢查映像數量
FRONTEND_COUNT=$(gcloud container images list-tags gcr.io/$PROJECT_ID/career-creator-frontend \
  --format="value(digest)" 2>/dev/null | wc -l)
BACKEND_COUNT=$(gcloud container images list-tags gcr.io/$PROJECT_ID/career-creator-backend \
  --format="value(digest)" 2>/dev/null | wc -l)

echo "🖼️  Frontend 映像數量: $FRONTEND_COUNT"
echo "🖼️  Backend 映像數量: $BACKEND_COUNT"

# 警報閾值
SIZE_THRESHOLD=500  # 500MB
COST_THRESHOLD=15   # TWD 15

echo ""
echo "⚠️  警報狀態:"

if (( $(echo "$SIZE_MB > $SIZE_THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
  echo "🚨 大小警報: Repository 超過 ${SIZE_THRESHOLD}MB 閾值！"
  echo "   建議執行清理: gh workflow run '🧹 Artifact Registry Cleanup'"
else
  echo "✅ 大小正常: 未超過 ${SIZE_THRESHOLD}MB 閾值"
fi

if (( $(echo "$COST_TWD > $COST_THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
  echo "🚨 成本警報: 預估月費用超過 TWD ${COST_THRESHOLD}！"
  echo "   建議立即清理或檢查設定"
else
  echo "✅ 成本正常: 預估月費用在 TWD ${COST_THRESHOLD} 以內"
fi

# 清理建議
TOTAL_IMAGES=$((FRONTEND_COUNT + BACKEND_COUNT))
if [ $TOTAL_IMAGES -gt 4 ]; then
  echo ""
  echo "💡 清理建議:"
  echo "   總映像數: $TOTAL_IMAGES (建議 ≤ 4)"
  echo "   執行清理: gh workflow run '🧹 Artifact Registry Cleanup' --field keep_images=2"
fi

echo ""
echo "📅 檢查時間: $(date)"
echo "=============================================="
