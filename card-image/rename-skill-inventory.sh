#!/bin/bash
set -e

echo "🔄 Renaming skill-inventory cards..."

cd "$(dirname "$0")"
count=0

# Process L size cards
if [ -d "職能盤點卡 成長規劃/L型卡片" ]; then
  echo ""
  echo "📁 Processing L size cards..."
  cd "職能盤點卡 成長規劃/L型卡片"

  # Process action cards (action01-10 → skill-inventory-01-10)
  for file in competencyassessmentcards_L_action*_front_*.png; do
    if [ -f "$file" ]; then
      # Extract action number (e.g., action01 -> 01)
      action_num=$(echo "$file" | sed 's/.*action\([0-9]*\)_front.*/\1/')

      new_name="skill-inventory-${action_num}-L-front-zhtw.png"

      if [ "$file" != "$new_name" ]; then
        mv "$file" "$new_name"
        echo "✓ $file → $new_name"
        ((count++))
      fi
    fi
  done

  # Process mindset cards (mindset01-42 → skill-inventory-11-52)
  for file in competencyassessmentcards_L_mindset*_*.png; do
    if [ -f "$file" ]; then
      # Extract mindset number and side
      mindset_num=$(echo "$file" | sed 's/.*mindset\([0-9]*\)_.*/\1/')
      side=$(echo "$file" | sed 's/.*mindset[0-9]*_\([^_]*\)_.*/\1/')

      # Convert mindset number to skill-inventory number (mindset01 -> 11, mindset42 -> 52)
      skill_num=$(printf "%02d" $((10 + $(echo $mindset_num | sed 's/^0*//'))))

      new_name="skill-inventory-${skill_num}-L-${side}-zhtw.png"

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
if [ -d "職能盤點卡 成長規劃/M型卡片" ]; then
  echo ""
  echo "📁 Processing M size cards..."
  cd "職能盤點卡 成長規劃/M型卡片"

  # Process action cards
  for file in competencyassessmentcards_M_action*_front_*.png; do
    if [ -f "$file" ]; then
      action_num=$(echo "$file" | sed 's/.*action\([0-9]*\)_front.*/\1/')
      new_name="skill-inventory-${action_num}-M-front-zhtw.png"

      if [ "$file" != "$new_name" ]; then
        mv "$file" "$new_name"
        echo "✓ $file → $new_name"
        ((count++))
      fi
    fi
  done

  # Process mindset cards
  for file in competencyassessmentcards_M_mindset*_*.png; do
    if [ -f "$file" ]; then
      mindset_num=$(echo "$file" | sed 's/.*mindset\([0-9]*\)_.*/\1/')
      side=$(echo "$file" | sed 's/.*mindset[0-9]*_\([^_]*\)_.*/\1/')
      skill_num=$(printf "%02d" $((10 + $(echo $mindset_num | sed 's/^0*//'))))
      new_name="skill-inventory-${skill_num}-M-${side}-zhtw.png"

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
if [ -d "職能盤點卡 成長規劃/S型卡片" ]; then
  echo ""
  echo "📁 Processing S size cards..."
  cd "職能盤點卡 成長規劃/S型卡片"

  # Process action cards
  for file in competencyassessmentcards_S_action*_front_*.png; do
    if [ -f "$file" ]; then
      action_num=$(echo "$file" | sed 's/.*action\([0-9]*\)_front.*/\1/')
      new_name="skill-inventory-${action_num}-S-front-zhtw.png"

      if [ "$file" != "$new_name" ]; then
        mv "$file" "$new_name"
        echo "✓ $file → $new_name"
        ((count++))
      fi
    fi
  done

  # Process mindset cards
  for file in competencyassessmentcards_S_mindset*_*.png; do
    if [ -f "$file" ]; then
      mindset_num=$(echo "$file" | sed 's/.*mindset\([0-9]*\)_.*/\1/')
      side=$(echo "$file" | sed 's/.*mindset[0-9]*_\([^_]*\)_.*/\1/')
      skill_num=$(printf "%02d" $((10 + $(echo $mindset_num | sed 's/^0*//'))))
      new_name="skill-inventory-${skill_num}-S-${side}-zhtw.png"

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
find "職能盤點卡 成長規劃/L型卡片" -name "skill-inventory-*-L-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  L size: {} files"
find "職能盤點卡 成長規劃/M型卡片" -name "skill-inventory-*-M-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  M size: {} files"
find "職能盤點卡 成長規劃/S型卡片" -name "skill-inventory-*-S-*.png" 2>/dev/null | wc -l | xargs -I {} echo "  S size: {} files"
