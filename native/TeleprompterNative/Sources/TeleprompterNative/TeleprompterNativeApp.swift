import AppKit
import SwiftUI

@main
struct TeleprompterNativeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        Settings { EmptyView() }
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private var controller: CuePanelController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let profile = NativeHelperProfile.fromEnvironment
        if let bridge = NativeHelperBridge.make(profile: profile) {
            controller = CuePanelController(bridge: bridge)
        } else {
            fputs("Teleprompter helper unavailable for the \(profile.rawValue) profile; using the development fixture. No compiler/store parity is claimed.\n", stderr)
            controller = CuePanelController(bridge: DevelopmentFixtureBridge())
        }
        controller?.show()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
}
