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
    private var mainWindowController: AnyObject?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let profile = NativeHelperProfile.fromEnvironment
        if let bridge = NativeHelperBridge.make(profile: profile) {
            controller = CuePanelController(bridge: bridge)
            let main = MainWindowController(bridge: bridge)
            mainWindowController = main
            main.show()
        } else {
            fputs("Teleprompter helper unavailable for the \(profile.rawValue) profile; using the development fixture. No compiler/store parity is claimed.\n", stderr)
            let fixture = DevelopmentFixtureBridge()
            controller = CuePanelController(bridge: fixture)
            let main = MainWindowController(bridge: fixture)
            mainWindowController = main
            main.show()
        }

        // The cursor-following Cue is spotlight-only. Its local shortcut monitor is
        // installed without showing the panel at launch; the fixed window is the
        // primary native app surface.
        controller?.startShortcutMonitoring()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
}
