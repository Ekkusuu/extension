#!/bin/bash
# Package the Firefox extension cleanly, without .git, .DS_Store, or macOS metadata.
# Run this from the extension directory: bash package.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/../extension.zip"

rm -f "$OUTPUT"

cd "$SCRIPT_DIR"
zip -r -X "$OUTPUT" . \
    -x "*.git*" \
    -x ".DS_Store" \
    -x "*/.DS_Store" \
    -x "package.sh" \
    -x "README.md"

echo "Created: $OUTPUT"
