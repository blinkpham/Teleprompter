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
        if let bridge = NativeHelperBridge.make() {
            controller = CuePanelController(bridge: bridge)
        } else {
            controller = CuePanelController(bridge: DevelopmentFixtureBridge())
        }
        controller?.show()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
}
