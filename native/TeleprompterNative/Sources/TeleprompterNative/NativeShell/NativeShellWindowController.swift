import AppKit
import SwiftUI

/// A fixed-size application shell that can be adopted by the native app entry
/// point without changing the existing Cue panel lane.
@MainActor
final class NativeShellWindowController: NSWindowController, NSWindowDelegate {
    static let fixedContentSize = NSSize(width: 1120, height: 760)

    init() {
        let window = NSWindow(
            contentRect: NSRect(origin: .zero, size: Self.fixedContentSize),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )

        super.init(window: window)

        window.title = "Teleprompter"
        window.titleVisibility = .visible
        window.titlebarAppearsTransparent = false
        window.isOpaque = true
        window.backgroundColor = .windowBackgroundColor
        window.isReleasedWhenClosed = false
        window.delegate = self
        window.contentAspectRatio = Self.fixedContentSize
        window.contentMinSize = Self.fixedContentSize
        window.contentMaxSize = Self.fixedContentSize
        window.collectionBehavior = [.fullScreenAuxiliary]
        window.contentView = NSHostingView(rootView: NativeShellRootView())
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("NativeShellWindowController does not support storyboard construction.")
    }

    func show() {
        guard let window else { return }

        if !window.isVisible {
            window.center()
        }
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        true
    }
}

private enum NativeShellSection: String, CaseIterable, Identifiable {
    case cue
    case library
    case tokens

    var id: String { rawValue }

    var title: String {
        switch self {
        case .cue: "Cue"
        case .library: "Library"
        case .tokens: "Tokens"
        }
    }

    var symbol: String {
        switch self {
        case .cue: "wand.and.stars"
        case .library: "square.grid.2x2"
        case .tokens: "text.book.closed"
        }
    }
}

struct NativeShellRootView: View {
    @State private var selectedSection: NativeShellSection = .cue

    var body: some View {
        HStack(spacing: 0) {
            sidebar

            Divider()

            Group {
                switch selectedSection {
                case .cue:
                    NativeShellCueSurface()
                case .library:
                    NativeShellPlaceholderView(
                        title: "Library",
                        symbol: "square.grid.2x2",
                        detail: "Accepted prompt records will live here."
                    )
                case .tokens:
                    NativeShellPlaceholderView(
                        title: "Tokens",
                        symbol: "text.book.closed",
                        detail: "Accepted direction tokens will live here."
                    )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(
            width: NativeShellWindowController.fixedContentSize.width,
            height: NativeShellWindowController.fixedContentSize.height
        )
        .background(Color(nsColor: .windowBackgroundColor))
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Teleprompter")
                    .font(.system(size: 19, weight: .bold, design: .rounded))

                Text("Offline prompt workspace")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 5) {
                ForEach(NativeShellSection.allCases) { section in
                    Button {
                        selectedSection = section
                    } label: {
                        Label(section.title, systemImage: section.symbol)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(selectedSection == section ? Color.orange : Color.primary)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 9)
                    .background(
                        selectedSection == section
                            ? Color.orange.opacity(0.13)
                            : Color.clear,
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )
                    .accessibilityIdentifier("native-shell-section-\(section.rawValue)")
                    .accessibilityAddTraits(selectedSection == section ? .isSelected : [])
                }
            }

            Spacer(minLength: 0)

            Text("Native shell lane")
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(.tertiary)
                .padding(.horizontal, 11)
        }
        .padding(22)
        .frame(width: 220, alignment: .topLeading)
        .frame(maxHeight: .infinity, alignment: .topLeading)
        .background(Color(nsColor: .underPageBackgroundColor))
    }
}

private struct NativeShellPlaceholderView: View {
    let title: String
    let symbol: String
    let detail: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 30, weight: .medium))
                .foregroundStyle(.secondary)

            Text(title)
                .font(.system(size: 22, weight: .bold, design: .rounded))

            Text(detail)
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
