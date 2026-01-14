#!/bin/bash
set -e

echo "🔄 Renaming profession-collector M and S size cards..."

cd "$(dirname "$0")"
count=0

# Process M size cards
if [ -d "職遊旅人卡 職業收藏家/M中型卡片" ]; then
  echo ""
  echo "📁 Processing M size cards..."
  cd "職遊旅人卡 職業收藏家/M中型卡片"

  for file in careerexplorercards_M_profession*_front_*.png; do
    if [ -f "$file" ]; then
      # Extract number from filename (e.g., profession01 -> 01)
      num=$(echo "$file" | sed 's/careerexplorercards_M_profession\([0-9]*\)_front_.*/\1/')

      new_name="profession-collector-${num}-M-front-zhtw.png"

      if [ "$file" != "$new_name" ]; then
        mv "$file" "$new_name"
        echo "✓ $file → $new_name"
        ((count++))
      fi
    fi
  done

  cd ../..
fi

# Process S size cards
if [ -d "職遊旅人卡 職業收藏家/S小型卡片" ]; then
  echo ""
  echo "📁 Processing S size cards..."
  cd "職遊旅人卡 職業收藏家/S小型卡片"

  for file in careerexplorercards_S_profession*_front_*.png; do
    if [ -f "$file" ]; then
      # Extract number from filename (e.g., profession01 -> 01)
      num=$(echo "$file" | sed 's/careerexplorercards_S_profession\([0-9]*\)_front_.*/\1/')

      new_name="profession-collector-${num}-S-front-zhtw.png"

      if [ "$file" != "$new_name" ]; then
        mv "$file" "$new_name"
        echo "✓ $file → $new_name"
        ((count++))
      fi
    fi
  done

  cd ../..
fi

echo ""
echo "✅ Rename complete! Total renamed: $count files"
echo ""
echo "📊 Files per size:"
find "職遊旅人卡 職業收藏家/M中型卡片" -name "profession-collector-*-M-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  M size: {} files"
find "職遊旅人卡 職業收藏家/S小型卡片" -name "profession-collector-*-S-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  S size: {} files"
