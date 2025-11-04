# GCS Upload Instructions

## 📦 Upload Card Images to Google Cloud Storage

### Prerequisites

1. GCS bucket created: `career-creator-assets`
2. gcloud CLI configured with `career-creator` configuration

### Step 1: Rename Files

```bash
cd card-image
chmod +x rename.sh
./rename.sh
```

### Step 2: Create GCS Bucket (if not exists)

```bash
# Switch to career-creator configuration
gcloud config configurations activate career-creator

# Create bucket
gsutil mb -p career-creator-card -c STANDARD -l asia-east1 gs://career-creator-assets/

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://career-creator-assets/
```

### Step 3: Upload Images

```bash
# Upload all PNG files to cards folder
gsutil -m cp *.png gs://career-creator-assets/cards/

# Verify upload
gsutil ls gs://career-creator-assets/cards/
```

### Step 4: Make Images Public

```bash
# Make all files in cards folder publicly readable
gsutil -m acl ch -u AllUsers:R gs://career-creator-assets/cards/*

# Or set CORS for web access
cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://career-creator-assets/
```

### Step 5: Verify URLs

Test a few URLs in browser:

```text
https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-front-zhtw.png
https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-realistic-L-back-zhtw.png
```

---

## 🔄 Future Updates

When adding new cards (M/S sizes, English versions, etc.):

```bash
# 1. Place new images in card-image folder with correct naming
# 2. Upload to GCS
gsutil -m cp personality-riasec-*-M-*-zhtw.png gs://career-creator-assets/cards/

# 3. Update card-assets.json availability
# Edit frontend/src/data/card-assets.json
```

---

## 📊 Current Inventory

After upload, you should have:

```text
gs://career-creator-assets/cards/
├── personality-riasec-artistic-L-back-zhtw.png
├── personality-riasec-artistic-L-front-zhtw.png
├── personality-riasec-conventional-L-back-zhtw.png
├── personality-riasec-conventional-L-front-zhtw.png
├── personality-riasec-enterprising-L-back-zhtw.png
├── personality-riasec-enterprising-L-front-zhtw.png
├── personality-riasec-investigative-L-back-zhtw.png
├── personality-riasec-investigative-L-front-zhtw.png
├── personality-riasec-realistic-L-back-zhtw.png
├── personality-riasec-realistic-L-front-zhtw.png
├── personality-riasec-social-L-back-zhtw.png
└── personality-riasec-social-L-front-zhtw.png
```

Total: 12 files (6 cards × 2 sides)

---

## 🧪 Test in Frontend

```typescript
import { getCardImageUrl, getCardBothSides } from '@/lib/card-asset-manager';

// Get single image
const url = getCardImageUrl({
  deck: 'personality-riasec',
  card: 'artistic',
  size: 'L',
  side: 'front',
  lang: 'zh'
});

// Get both sides
const { front, back } = getCardBothSides('personality-riasec', 'artistic');

console.log(front);
// https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-front-zhtw.png
```
