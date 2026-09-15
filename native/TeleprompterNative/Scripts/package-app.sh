#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
bin_dir=$(swift build --package-path "$root" -c debug --show-bin-path)
bundle="$root/.build/TeleprompterNative.app"
resource_bundle="$bin_dir/TeleprompterNative_TeleprompterNative.bundle"

if [ ! -d "$resource_bundle" ]; then
  echo "Teleprompter native package failed: resource bundle is missing at $resource_bundle; run swift build first." >&2
  exit 1
fi

mkdir -p "$bundle/Contents/MacOS" "$bundle/Contents/Resources"
cp "$root/AppBundle/Info.plist" "$bundle/Contents/Info.plist"
cp "$bin_dir/TeleprompterNative" "$bundle/Contents/MacOS/TeleprompterNative"
rm -rf "$bundle/TeleprompterNative_TeleprompterNative.bundle"
cp "$resource_bundle/group-optics-v2.png" "$bundle/Contents/Resources/group-optics-v2.png"
cp "$resource_bundle/group-stage-v2.png" "$bundle/Contents/Resources/group-stage-v2.png"
cp "$resource_bundle/group-finish-v2.png" "$bundle/Contents/Resources/group-finish-v2.png"
helper="${TELEPROMPTER_HELPER_PATH:-$root/../../out/helper/teleprompter-helper.js}"
if [ ! -r "$helper" ]; then
  echo "Teleprompter native package failed: helper is missing at $helper; run npm run helper:build first." >&2
  exit 1
fi
cp "$helper" "$bundle/Contents/Resources/teleprompter-helper.js"
/usr/bin/codesign --force --deep --sign - "$bundle" >/dev/null
echo "Teleprompter native package: helper bundled; Node remains an explicit runtime dependency (TELEPROMPTER_NODE_PATH or standard system path)." >&2
printf '%s\n' "$bundle"
