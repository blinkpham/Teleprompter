#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
bin_dir=$(swift build --package-path "$root" -c debug --show-bin-path)
bundle="$root/.build/TeleprompterNative.app"

mkdir -p "$bundle/Contents/MacOS" "$bundle/Contents/Resources"
cp "$root/AppBundle/Info.plist" "$bundle/Contents/Info.plist"
cp "$bin_dir/TeleprompterNative" "$bundle/Contents/MacOS/TeleprompterNative"
helper="${TELEPROMPTER_HELPER_PATH:-$root/../../out/helper/teleprompter-helper.js}"
if [ ! -r "$helper" ]; then
  echo "Teleprompter native package failed: helper is missing at $helper; run npm run helper:build first." >&2
  exit 1
fi
cp "$helper" "$bundle/Contents/Resources/teleprompter-helper.js"
/usr/bin/codesign --force --deep --sign - "$bundle" >/dev/null
echo "Teleprompter native package: helper bundled; Node remains an explicit runtime dependency (TELEPROMPTER_NODE_PATH or standard system path)." >&2
printf '%s\n' "$bundle"
