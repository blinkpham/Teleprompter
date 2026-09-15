// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "TeleprompterNative",
    platforms: [.macOS(.v26)],
    products: [
        .executable(name: "TeleprompterNative", targets: ["TeleprompterNative"]),
    ],
    targets: [
        .executableTarget(
            name: "TeleprompterNative",
            path: "Sources/TeleprompterNative"
        ),
    ]
)
