#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
bin_dir=$(swift build -c debug --show-bin-path)
bundle="$root/.build/TeleprompterNative.app"

mkdir -p "$bundle/Contents/MacOS" "$bundle/Contents/Resources"
cp "$root/AppBundle/Info.plist" "$bundle/Contents/Info.plist"
cp "$bin_dir/TeleprompterNative" "$bundle/Contents/MacOS/TeleprompterNative"
helper="$root/../../out/helper/teleprompter-helper.js"
if [ -r "$helper" ]; then
  cp "$helper" "$bundle/Contents/Resources/teleprompter-helper.js"
fi
/usr/bin/codesign --force --deep --sign - "$bundle" >/dev/null
printf '%s\n' "$bundle"
