#!/bin/bash
# Rename value navigation cards to standard naming convention
# Format: value-navigation-{id}-{size}-{side}-zhtw.png

set -e

echo "🔄 Renaming value navigation cards..."

cd "$(dirname "$0")"

# Counter for renamed files
count=0

# Process L size cards
if [ -d "價值導航卡 價值觀排序/L型卡片" ]; then
  cd "價值導航卡 價值觀排序/L型卡片"

  for file in valuescard_L_*_*.png; do
    if [ -f "$file" ]; then
      # Extract number and side from filename
      # Format: valuescard_L_01_front.png -> value-navigation-01-L-front-zhtw.png
      num=$(echo "$file" | sed 's/valuescard_L_\([0-9]*\)_\(.*\)\.png/\1/')
      side=$(echo "$file" | sed 's/valuescard_L_\([0-9]*\)_\(.*\)\.png/\2/')

      new_name="value-navigation-${num}-L-${side}-zhtw.png"

      if [ "$file" != "$new_name" ]; then
        mv "$file" "$new_name"
        echo "✓ $file → $new_name"
        ((count++))
      fi
    fi
  done

  cd ../..
fi

# Process M size cards
if [ -d "價值導航卡 價值觀排序/M型卡片" ]; then
  cd "價值導航卡 價值觀排序/M型卡片"

  for file in valuescard_M_*_*.png; do
    if [ -f "$file" ]; then
      num=$(echo "$file" | sed 's/valuescard_M_\([0-9]*\)_\(.*\)\.png/\1/')
      side=$(echo "$file" | sed 's/valuescard_M_\([0-9]*\)_\(.*\)\.png/\2/')

      new_name="value-navigation-${num}-M-${side}-zhtw.png"

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
if [ -d "價值導航卡 價值觀排序/S型卡片" ]; then
  cd "價值導航卡 價值觀排序/S型卡片"

  for file in valuescard_S_*_*.png; do
    if [ -f "$file" ]; then
      num=$(echo "$file" | sed 's/valuescard_S_\([0-9]*\)_\(.*\)\.png/\1/')
      side=$(echo "$file" | sed 's/valuescard_S_\([0-9]*\)_\(.*\)\.png/\2/')

      new_name="value-navigation-${num}-S-${side}-zhtw.png"

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
find "價值導航卡 價值觀排序" -name "value-navigation-*-L-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  L size: {} files"
find "價值導航卡 價值觀排序" -name "value-navigation-*-M-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  M size: {} files"
find "價值導航卡 價值觀排序" -name "value-navigation-*-S-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  S size: {} files"
echo ""
echo "📤 Ready for GCS upload!"
