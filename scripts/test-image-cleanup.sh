#!/bin/bash

# 測試 Docker 映像清理邏輯的腳本
# 此腳本模擬 CI/CD 中的清理步驟，但使用 dry-run 模式

set -e

echo "========================================"
echo "Docker Image Cleanup Test Script"
echo "========================================"
echo ""

PROJECT_ID="career-creator-472207"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/career-creator-frontend"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/career-creator-backend"

test_cleanup() {
    local IMAGE_NAME=$1
    local ENV=$2

    echo "Testing cleanup for: $IMAGE_NAME (environment: $ENV)"
    echo "----------------------------------------"

    # Step 1: List all tags matching the environment pattern
    echo "1. Listing all images with tag pattern: ${ENV}-*"
    echo "   Command: gcloud container images list-tags $IMAGE_NAME --filter=\"tags:${ENV}-*\" --format=\"get(digest,tags)\" --sort-by=\"~timestamp\""

    # Try to list (may fail due to permissions)
    if gcloud container images list-tags "$IMAGE_NAME" \
        --filter="tags:${ENV}-*" \
        --format="get(digest,tags)" \
        --sort-by="~timestamp" 2>/dev/null; then

        echo ""
        echo "2. Getting digests to delete (keeping latest 3):"
        DIGESTS=$(gcloud container images list-tags "$IMAGE_NAME" \
            --filter="tags:${ENV}-*" \
            --format="get(digest)" \
            --sort-by="~timestamp" | tail -n +4)

        if [ -z "$DIGESTS" ]; then
            echo "   No images to clean up (3 or fewer images exist)"
        else
            echo "   Images that would be deleted:"
            for DIGEST in $DIGESTS; do
                echo "   - $IMAGE_NAME@$DIGEST"
            done

            echo ""
            echo "3. Delete command (DRY RUN - not executing):"
            for DIGEST in $DIGESTS; do
                echo "   gcloud container images delete \"$IMAGE_NAME@$DIGEST\" --quiet --force-delete-tags"
            done
        fi
    else
        echo "   ⚠️  Permission denied or images not found"
        echo "   This is expected if running locally without proper GCP permissions"
        echo "   The cleanup will work in CI/CD with proper service account permissions"
    fi

    echo ""
}

# Test frontend cleanup
echo "FRONTEND CLEANUP TEST"
echo "===================="
test_cleanup "$FRONTEND_IMAGE" "staging"
test_cleanup "$FRONTEND_IMAGE" "main"

echo ""
echo "BACKEND CLEANUP TEST"
echo "==================="
test_cleanup "$BACKEND_IMAGE" "staging"
test_cleanup "$BACKEND_IMAGE" "main"

echo ""
echo "========================================"
echo "Cleanup Logic Verification Complete"
echo "========================================"
echo ""
echo "Summary:"
echo "- The cleanup logic targets images with specific environment tags (staging-* or main-*)"
echo "- It keeps the latest 3 images and deletes older ones"
echo "- Uses 'tail -n +4' to skip the first 3 entries (newest)"
echo "- Includes --quiet and --force-delete-tags for non-interactive deletion"
echo ""
echo "Note: This script may show permission errors when run locally."
echo "The actual cleanup runs in CI/CD with proper service account permissions."
