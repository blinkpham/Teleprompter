import AppKit
import SwiftUI

extension Notification.Name {
    static let cueDismissPanel = Notification.Name("TeleprompterNative.cueDismissPanel")
}

final class CuePanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

private final class PassthroughVisualEffectView: NSVisualEffectView {
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
}

@MainActor
final class CuePanelController: NSObject, NSWindowDelegate {
    private let panel: CuePanel
    private let backdrop: PassthroughVisualEffectView
    private var globalMouseMonitor: Any?
    private var localMouseMonitor: Any?
    private var localKeyMonitor: Any?

    init<Bridge: NativeRuntimeBridge>(bridge: Bridge) {
        panel = CuePanel(
            contentRect: NSRect(x: 0, y: 0, width: 680, height: 620),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        backdrop = PassthroughVisualEffectView(frame: .zero)
        super.init()
        panel.title = "Teleprompter"
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.hidesOnDeactivate = false
        panel.isMovableByWindowBackground = true
        panel.delegate = self

        let reduceTransparency = NSWorkspace.shared.accessibilityDisplayShouldReduceTransparency
        backdrop.material = reduceTransparency ? .underPageBackground : .hudWindow
        backdrop.blendingMode = reduceTransparency ? .withinWindow : .behindWindow
        backdrop.state = .active
        backdrop.isEmphasized = true
        backdrop.alphaValue = reduceTransparency ? 1 : 0.92

        let content = NSView(frame: .zero)
        content.wantsLayer = true
        content.layer?.cornerRadius = 22
        content.layer?.masksToBounds = true

        let host = NSHostingView(rootView: CueView(bridge: bridge))
        host.translatesAutoresizingMaskIntoConstraints = false
        backdrop.translatesAutoresizingMaskIntoConstraints = false
        content.addSubview(backdrop)
        content.addSubview(host)

        NSLayoutConstraint.activate([
            backdrop.leadingAnchor.constraint(equalTo: content.leadingAnchor),
            backdrop.trailingAnchor.constraint(equalTo: content.trailingAnchor),
            backdrop.topAnchor.constraint(equalTo: content.topAnchor),
            backdrop.bottomAnchor.constraint(equalTo: content.bottomAnchor),
            host.leadingAnchor.constraint(equalTo: content.leadingAnchor),
            host.trailingAnchor.constraint(equalTo: content.trailingAnchor),
            host.topAnchor.constraint(equalTo: content.topAnchor),
            host.bottomAnchor.constraint(equalTo: content.bottomAnchor)
        ])

        panel.contentView = content
    }

    func show() {
        guard let screen = NSScreen.main else { return }
        let visible = screen.visibleFrame
        let size = panel.frame.size
        panel.setFrameOrigin(NSPoint(
            x: visible.midX - size.width / 2,
            y: visible.maxY - size.height - 72
        ))
        installMouseMonitors()
        panel.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func startShortcutMonitoring() {
        installMouseMonitors()
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        removeMouseMonitors()
        return true
    }

    private func installMouseMonitors() {
        guard globalMouseMonitor == nil, localMouseMonitor == nil else { return }

        globalMouseMonitor = NSEvent.addGlobalMonitorForEvents(matching: .leftMouseDown) { _ in
            DispatchQueue.main.async { [weak self] in
                self?.panel.orderOut(nil)
            }
        }

        localMouseMonitor = NSEvent.addLocalMonitorForEvents(matching: .leftMouseDown) { [weak self] event in
            guard let self, let eventWindow = event.window else { return event }
            if eventWindow !== self.panel {
                self.panel.orderOut(nil)
            }
            return event
        }

        localKeyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            let modifiers = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
            let isCueShortcut = modifiers.contains(.control)
                && event.charactersIgnoringModifiers?.lowercased() == "c"

            guard isCueShortcut else { return event }
            self?.toggleVisibility()
            return nil
        }
    }

    private func removeMouseMonitors() {
        if let globalMouseMonitor {
            NSEvent.removeMonitor(globalMouseMonitor)
            self.globalMouseMonitor = nil
        }
        if let localMouseMonitor {
            NSEvent.removeMonitor(localMouseMonitor)
            self.localMouseMonitor = nil
        }
        if let localKeyMonitor {
            NSEvent.removeMonitor(localKeyMonitor)
            self.localKeyMonitor = nil
        }
    }

    private func toggleVisibility() {
        if panel.isVisible {
            panel.orderOut(nil)
        } else {
            show()
        }
    }
}
