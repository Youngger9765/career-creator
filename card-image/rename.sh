#!/bin/bash
# Rename card images to new naming convention
# Format: {deck}-{card}-{size}-{side}-{lang}.png

set -e

echo "🔄 Renaming card images to new convention..."

# Check if we're in the card-image directory
if [ ! -f "card_L_artistic_front_440x770.png" ]; then
    echo "❌ Error: Please run this script from the card-image directory"
    exit 1
fi

# Rename function
rename_card() {
    local old_name=$1
    local new_name=$2

    if [ -f "$old_name" ]; then
        mv "$old_name" "$new_name"
        echo "✓ $old_name → $new_name"
    else
        echo "⚠ Warning: $old_name not found"
    fi
}

# Rename all personality RIASEC cards
rename_card "card_L_artistic_back_440x770.png" "personality-riasec-artistic-L-back-zh.png"
rename_card "card_L_artistic_front_440x770.png" "personality-riasec-artistic-L-front-zh.png"
rename_card "card_L_conventional_back_440x770.png" "personality-riasec-conventional-L-back-zh.png"
rename_card "card_L_conventional_front_440x770.png" "personality-riasec-conventional-L-front-zh.png"
rename_card "card_L_enterprising_back_440x770.png" "personality-riasec-enterprising-L-back-zh.png"
rename_card "card_L_enterprising_front_440x770.png" "personality-riasec-enterprising-L-front-zh.png"
rename_card "card_L_investigative_back_440x770.png" "personality-riasec-investigative-L-back-zh.png"
rename_card "card_L_investigative_front_440x770.png" "personality-riasec-investigative-L-front-zh.png"
rename_card "card_L_realistic_back_440x770.png" "personality-riasec-realistic-L-back-zh.png"
rename_card "card_L_realistic_front_440x770.png" "personality-riasec-realistic-L-front-zh.png"
rename_card "card_L_social_back_440x770.png" "personality-riasec-social-L-back-zh.png"
rename_card "card_L_social_front_440x770.png" "personality-riasec-social-L-front-zh.png"

echo ""
echo "✅ Rename complete! Files ready for GCS upload."
echo ""
echo "📤 Next steps:"
echo "1. Upload to GCS: gsutil -m cp -r *.png gs://career-creator-assets/cards/"
echo "2. Make files public: gsutil -m acl ch -u AllUsers:R gs://career-creator-assets/cards/*"
