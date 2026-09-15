import SwiftUI

struct CueView<Bridge: NativeRuntimeBridge>: View {
    private enum ActiveModal: String, Identifiable {
        case optics
        case stage
        case finish
        case preview

        var id: String { rawValue }

        var title: String {
            switch self {
            case .optics: "Optics"
            case .stage: "Stage"
            case .finish: "Finish"
            case .preview: "Preview"
            }
        }
    }

    private let bridge: Bridge
    @State private var what = ""
    @State private var snapshot: NativeBootstrap
    @State private var previewText = ""
    @State private var activeModal: ActiveModal?
    @State private var applied = false
    @FocusState private var editorFocused: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(bridge: Bridge) {
        self.bridge = bridge
        _snapshot = State(initialValue: bridge.bootstrap())
        _previewText = State(initialValue: bridge.preview().text)
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            composer
                .allowsHitTesting(activeModal == nil)
                .accessibilityHidden(activeModal != nil)

            if let activeModal {
                modal(for: activeModal)
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .opacity.combined(with: .scale(scale: 0.92, anchor: .top))
                    )
                    .zIndex(1)
            }
        }
        .frame(minWidth: 480, idealWidth: 620, maxWidth: 720, alignment: .leading)
        .padding(24)
        .animation(surfaceAnimation, value: activeModal)
        .onExitCommand(perform: dismissModal)
    }

    private var composer: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField("Describe the subject, action, and scene", text: $what, axis: .vertical)
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .textFieldStyle(.plain)
                .lineLimit(1...4)
                .focused($editorFocused)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .modifier(FloatingSurface(shape: RoundedRectangle(cornerRadius: 20, style: .continuous), tint: .blue))
                .accessibilityLabel("Prompt")
                .accessibilityHint("Describe the subject, action, and scene")

            HStack(spacing: 10) {
                parameterButton(title: "Optics", symbol: "camera.aperture", tint: .cyan, modal: .optics)
                parameterButton(title: "Stage", symbol: "rectangle.3.group", tint: .purple, modal: .stage)
                parameterButton(title: "Finish", symbol: "circle.dotted", tint: .orange, modal: .finish)
            }

            HStack(spacing: 10) {
                actionButton(title: "Preview", symbol: "eye", prominence: .secondary, action: openPreview)
                actionButton(title: applied ? "Applied" : "Apply", symbol: applied ? "checkmark" : "arrow.down.to.line", prominence: .primary, action: apply)
            }
        }
    }

    @ViewBuilder
    private func parameterButton(title: String, symbol: String, tint: Color, modal: ActiveModal) -> some View {
        Button {
            open(modal)
        } label: {
            HStack(spacing: 10) {
                Image(systemName: symbol)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(tint)
                    .frame(width: 30, height: 30)
                    .background(tint.opacity(0.16), in: Circle())
                Text(title)
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(.primary)
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 12)
            .frame(height: 52)
            .contentShape(Capsule())
        }
        .buttonStyle(FloatingControlStyle(tint: tint, reduceMotion: reduceMotion))
        .accessibilityLabel("Open \(title) settings")
        .accessibilityHint("Opens a focused \(title) flow")
    }

    @ViewBuilder
    private func actionButton(title: String, symbol: String, prominence: FloatingActionStyle.Prominence, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .frame(maxWidth: .infinity)
                .frame(height: 46)
                .contentShape(Capsule())
        }
        .buttonStyle(FloatingActionStyle(prominence: prominence, reduceMotion: reduceMotion))
    }

    @ViewBuilder
    private func modal(for modal: ActiveModal) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 12) {
                Text(modal.title)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                Spacer()
                Button(action: dismissModal) {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .frame(width: 34, height: 34)
                        .contentShape(Circle())
                }
                .buttonStyle(FloatingCloseStyle(reduceMotion: reduceMotion))
                .accessibilityLabel("Close \(modal.title)")
            }

            modalContent(for: modal)
        }
        .padding(20)
        .frame(minWidth: 380, idealWidth: 460, maxWidth: 560, alignment: .leading)
        .modifier(FloatingSurface(shape: RoundedRectangle(cornerRadius: 26, style: .continuous), tint: modalTint(for: modal)))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(modal.title) modal")
        .accessibilityAddTraits(.isModal)
    }

    @ViewBuilder
    private func modalContent(for modal: ActiveModal) -> some View {
        switch modal {
        case .optics:
            VStack(alignment: .leading, spacing: 8) {
                Text("Focal")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)
                HStack {
                    Text("Natural 50")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                    Spacer()
                    Text("50 mm")
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }
                .padding(14)
                .modifier(FloatingSurface(shape: RoundedRectangle(cornerRadius: 16, style: .continuous), tint: .cyan))
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Natural 50, 50 millimetres")
                .accessibilityHint("Read-only value supplied by the development fixture")
            }

        case .stage, .finish:
            Text("This development fixture does not expose \(modal.title) choices yet.")
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

        case .preview:
            VStack(alignment: .leading, spacing: 12) {
                ScrollView {
                    Text(previewText)
                        .font(.system(.body, design: .monospaced))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .textSelection(.enabled)
                        .padding(.vertical, 2)
                }
                .frame(maxHeight: 260)
                .padding(14)
                .modifier(FloatingSurface(shape: RoundedRectangle(cornerRadius: 16, style: .continuous), tint: .blue))
                .accessibilityLabel("Preview text")

                Text("Development fixture output — compiler connection pending.")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func modalTint(for modal: ActiveModal) -> Color {
        switch modal {
        case .optics: .cyan
        case .stage: .purple
        case .finish: .orange
        case .preview: .blue
        }
    }

    private var surfaceAnimation: Animation {
        reduceMotion
            ? .easeOut(duration: 0.08)
            : .spring(response: 0.42, dampingFraction: 0.7, blendDuration: 0.18)
    }

    private func open(_ modal: ActiveModal) {
        withAnimation(surfaceAnimation) {
            activeModal = modal
        }
    }

    private func openPreview() {
        previewText = bridge.preview().text
        open(.preview)
    }

    private func dismissModal() {
        withAnimation(surfaceAnimation) {
            activeModal = nil
        }
        editorFocused = true
    }

    private func apply() {
        snapshot = bridge.apply(NativeCueCommand(type: "set-what", expectedRevision: snapshot.draftRevision, value: what))
        withAnimation(surfaceAnimation) {
            applied = true
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(0.85))
            withAnimation(surfaceAnimation) {
                applied = false
            }
        }
    }
}

private struct FloatingSurface<S: InsettableShape>: ViewModifier {
    let shape: S
    let tint: Color
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    func body(content: Content) -> some View {
        if #available(macOS 26.0, *), !reduceTransparency {
            content
                .background(shape.fill(Color.black.opacity(0.2)))
                .glassEffect(.regular.tint(tint.opacity(0.16)).interactive(), in: shape)
                .overlay(shape.strokeBorder(.white.opacity(0.16), lineWidth: 0.7))
                .shadow(color: tint.opacity(0.12), radius: 24, y: 10)
        } else {
            content
                .background(shape.fill(Color(red: 0.055, green: 0.075, blue: 0.12).opacity(0.98)))
                .overlay(shape.strokeBorder(tint.opacity(0.36), lineWidth: 0.8))
                .shadow(color: .black.opacity(0.38), radius: 20, y: 10)
        }
    }
}

private struct FloatingControlStyle: ButtonStyle {
    let tint: Color
    let reduceMotion: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .modifier(FloatingSurface(shape: Capsule(), tint: tint))
            .scaleEffect(configuration.isPressed ? 0.965 : 1)
            .offset(y: configuration.isPressed ? 1 : 0)
            .animation(interactionAnimation, value: configuration.isPressed)
    }

    private var interactionAnimation: Animation {
        reduceMotion ? .easeOut(duration: 0.08) : .spring(response: 0.24, dampingFraction: 0.58, blendDuration: 0.1)
    }
}

private struct FloatingActionStyle: ButtonStyle {
    enum Prominence {
        case primary
        case secondary
    }

    let prominence: Prominence
    let reduceMotion: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(prominence == .primary ? Color.black : Color.white)
            .background(actionFill, in: Capsule())
            .overlay(Capsule().strokeBorder(actionStroke, lineWidth: 0.8))
            .shadow(color: prominence == .primary ? Color.cyan.opacity(0.26) : .black.opacity(0.3), radius: 18, y: 8)
            .scaleEffect(configuration.isPressed ? 0.955 : 1)
            .offset(y: configuration.isPressed ? 1 : 0)
            .animation(interactionAnimation, value: configuration.isPressed)
    }

    private var actionFill: Color {
        prominence == .primary ? Color(red: 0.58, green: 0.84, blue: 1) : Color(red: 0.06, green: 0.085, blue: 0.14).opacity(0.94)
    }

    private var actionStroke: Color {
        prominence == .primary ? Color.white.opacity(0.5) : Color.white.opacity(0.18)
    }

    private var interactionAnimation: Animation {
        reduceMotion ? .easeOut(duration: 0.08) : .spring(response: 0.25, dampingFraction: 0.56, blendDuration: 0.1)
    }
}

private struct FloatingCloseStyle: ButtonStyle {
    let reduceMotion: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.secondary)
            .background(.white.opacity(configuration.isPressed ? 0.17 : 0.08), in: Circle())
            .scaleEffect(configuration.isPressed ? 0.9 : 1)
            .animation(reduceMotion ? .easeOut(duration: 0.08) : .spring(response: 0.22, dampingFraction: 0.58), value: configuration.isPressed)
    }
}
