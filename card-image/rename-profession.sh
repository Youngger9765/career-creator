#!/bin/bash
# Rename profession collector cards to new naming convention
# Format: profession-collector-{id}-L-front-zhtw.png

set -e

echo "🔄 Renaming profession collector cards..."

cd "$(dirname "$0")"

for i in {1..100}; do
  old="card_profession_L_$(printf "%02d" $i).png"
  new="profession-collector-$(printf "%02d" $i)-L-front-zhtw.png"

  if [ -f "$old" ]; then
    mv "$old" "$new"
    echo "✓ $old → $new"
  else
    echo "⚠ Warning: $old not found"
  fi
done

echo ""
echo "✅ Rename complete! Total files:"
ls -1 profession-collector-*.png | wc -l

echo ""
echo "📤 Files ready for GCS upload"
