import SwiftUI

struct CueView<Bridge: NativeRuntimeBridge>: View {
    private enum ParameterGroup: String, CaseIterable, Hashable {
        case optics
        case stage
        case finish

        var title: String {
            switch self {
            case .optics: "Optics"
            case .stage: "Stage"
            case .finish: "Finish"
            }
        }

        var axisTitle: String {
            switch self {
            case .optics: "Focal"
            case .stage: "Composition"
            case .finish: "Look"
            }
        }

        var symbol: String {
            switch self {
            case .optics: "camera.aperture"
            case .stage: "rectangle.3.group"
            case .finish: "circle.dotted"
            }
        }

        var tint: Color {
            switch self {
            case .optics: .cyan
            case .stage: .purple
            case .finish: .orange
            }
        }
    }

    private enum ConfigurationPanel: Equatable {
        case group(ParameterGroup)
        case ratio
        case resolution
        case reference

        var accessibilityIdentifier: String {
            switch self {
            case let .group(group): "cue-panel-\(group.rawValue)"
            case .ratio: "cue-panel-ratio"
            case .resolution: "cue-panel-resolution"
            case .reference: "cue-panel-reference"
            }
        }
    }

    private enum FocusTarget: Hashable {
        case prompt
        case group(ParameterGroup)
        case ratio
        case resolution
        case reference
        case slash
        case mention
        case preview
        case apply

        var revealsControls: Bool {
            switch self {
            case .group, .ratio, .resolution, .reference:
                true
            case .prompt, .slash, .mention, .preview, .apply:
                false
            }
        }
    }

    private enum PromptAssist: String, Identifiable {
        case slash
        case mention

        var id: String { rawValue }

        var title: String {
            switch self {
            case .slash: "/ commands"
            case .mention: "@ references"
            }
        }
    }

    private let bridge: Bridge
    @State private var what = ""
    @State private var snapshot: NativeBootstrap
    @State private var previewText = ""
    @State private var activePanel: ConfigurationPanel?
    @State private var previewVisible = false
    @State private var applied = false
    @State private var controlsHovered = false
    @State private var promptAssist: PromptAssist?
    @State private var ratioValue = "4:5"
    @State private var resolutionValue = "2K"
    @FocusState private var focusedElement: FocusTarget?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(bridge: Bridge) {
        self.bridge = bridge
        _snapshot = State(initialValue: bridge.bootstrap())
        _previewText = State(initialValue: bridge.preview().text)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header

            configurationArea

            if let activePanel {
                configurationPanel(for: activePanel)
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .move(edge: .top).combined(with: .opacity)
                    )
            }

            auxiliaryControls

            promptAndActions

            if previewVisible {
                previewSection
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .move(edge: .top).combined(with: .opacity)
                    )
            }
        }
        .padding(18)
        .frame(minWidth: 500, idealWidth: 700, maxWidth: 820, alignment: .leading)
        .modifier(
            CueShellSurface(
                shape: RoundedRectangle(cornerRadius: 28, style: .continuous),
                tint: .cyan
            )
        )
        .animation(surfaceAnimation, value: activePanel)
        .animation(surfaceAnimation, value: previewVisible)
        .defaultFocus($focusedElement, .prompt)
        .onExitCommand(perform: dismissPanel)
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 10) {
            Image(systemName: "text.badge.plus")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.cyan)
                .frame(width: 30, height: 30)
                .background(Color.cyan.opacity(0.14), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                .accessibilityHidden(true)

            Text("Cue")
                .font(.system(size: 16, weight: .bold, design: .rounded))

            Spacer(minLength: 0)

            Text("Create")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
                .opacity(controlsRevealed ? 1 : 0)
                .accessibilityHidden(!controlsRevealed)
                .animation(surfaceAnimation, value: controlsRevealed)
        }
        .padding(.bottom, 14)
    }

    private var configurationArea: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 9) {
                ForEach(ParameterGroup.allCases, id: \.self) { group in
                    parameterButton(for: group)
                }
            }

        }
        .onHover { isHovered in
            controlsHovered = isHovered
        }
        .animation(surfaceAnimation, value: controlsRevealed)
    }

    private var controlsRevealed: Bool {
        controlsHovered || activePanel != nil || focusedElement?.revealsControls == true
    }

    private var auxiliaryControls: some View {
        HStack(spacing: 8) {
            outputButton(title: "Ratio", value: ratioValue, symbol: "rectangle.portrait", panel: .ratio, focus: .ratio)
            outputButton(title: "Resolution", value: resolutionValue, symbol: "square.resize", panel: .resolution, focus: .resolution)
            referenceButton
        }
        .padding(.top, 10)
    }

    @ViewBuilder
    private func parameterButton(for group: ParameterGroup) -> some View {
        let isOpen = activePanel == .group(group)

        Button {
            focusedElement = .group(group)
            togglePanel(.group(group))
        } label: {
            HStack(spacing: 10) {
                Image(systemName: group.symbol)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(group.tint)
                    .frame(width: 34, height: 34)
                    .background(group.tint.opacity(isOpen ? 0.25 : 0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(group.title)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)

                    if controlsRevealed || isOpen {
                        Text(group.axisTitle)
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                            .transition(.opacity)
                    }
                }

                Spacer(minLength: 0)

                Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .opacity(controlsRevealed || isOpen ? 1 : 0.55)
            }
            .padding(.horizontal, 11)
            .padding(.vertical, 9)
            .frame(maxWidth: .infinity, minHeight: controlsRevealed || isOpen ? 62 : 52, alignment: .leading)
            .background(
                Color.white.opacity(isOpen ? 0.13 : 0.075),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focused($focusedElement, equals: .group(group))
        .accessibilityIdentifier("cue-group-\(group.rawValue)")
        .accessibilityLabel(group.title)
        .accessibilityValue(isOpen ? "\(group.axisTitle), expanded" : "\(group.axisTitle), collapsed")
        .accessibilityHint("Shows \(group.title) choices")
        .help("\(group.title) — \(group.axisTitle)")
    }

    @ViewBuilder
    private func outputButton(
        title: String,
        value: String,
        symbol: String,
        panel: ConfigurationPanel,
        focus: FocusTarget
    ) -> some View {
        let isOpen = activePanel == panel

        Button {
            focusedElement = focus
            togglePanel(panel)
        } label: {
            HStack(spacing: 7) {
                Image(systemName: symbol)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)
                    Text("\(value) · UI")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                }

                Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(
                Color.white.opacity(isOpen ? 0.13 : 0.06),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focused($focusedElement, equals: focus)
        .accessibilityIdentifier(
            panel == .ratio ? "cue-ratio" : panel == .resolution ? "cue-resolution" : "cue-output-control"
        )
        .accessibilityLabel("\(title), \(value), UI only")
        .accessibilityHint("UI-only affordance; not saved or sent to the bridge")
        .help("\(title): \(value), UI only")
    }

    private var referenceButton: some View {
        let isOpen = activePanel == .reference

        return Button {
            focusedElement = .reference
            togglePanel(.reference)
        } label: {
            Label("Add Reference", systemImage: "plus")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.primary)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(
                    Color.white.opacity(isOpen ? 0.13 : 0.06),
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
                .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focused($focusedElement, equals: .reference)
        .accessibilityIdentifier("cue-add-reference")
        .accessibilityLabel("Add Reference")
        .accessibilityHint("Opens the future reference binding hook")
        .help("Add Reference")
    }

    @ViewBuilder
    private func configurationPanel(for panel: ConfigurationPanel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(panelTitle(panel))
                    .font(.system(size: 14, weight: .bold, design: .rounded))

                Spacer(minLength: 0)

                Button(action: dismissPanel) {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .frame(width: 28, height: 28)
                        .background(Color.white.opacity(0.08), in: Circle())
                        .contentShape(Circle())
                }
                .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
                .accessibilityLabel("Close \(panelTitle(panel))")
                .help("Close")
            }

            panelContent(panel)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            Color.black.opacity(0.16),
            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
        )
        .shadow(color: .black.opacity(0.16), radius: 16, y: 8)
        .padding(.top, 4)
        .padding(.bottom, 12)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(panel.accessibilityIdentifier)
        .accessibilityLabel("\(panelTitle(panel)) selection panel")
    }

    private func panelTitle(_ panel: ConfigurationPanel) -> String {
        switch panel {
        case let .group(group): group.axisTitle
        case .ratio: "Output ratio"
        case .resolution: "Resolution target"
        case .reference: "Add Reference"
        }
    }

    @ViewBuilder
    private func panelContent(_ panel: ConfigurationPanel) -> some View {
        switch panel {
        case .group(.optics):
            VStack(alignment: .leading, spacing: 8) {
                Text("Focal")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                HStack(spacing: 10) {
                    Image(systemName: "camera.aperture")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.cyan)
                        .frame(width: 34, height: 34)
                        .background(Color.cyan.opacity(0.15), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .accessibilityHidden(true)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Natural 50")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                        Text("50 mm · development fixture choice")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }

                    Spacer(minLength: 0)
                }
                .padding(10)
                .background(Color.cyan.opacity(0.09), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Natural 50, 50 millimetres")
                .accessibilityHint("Fixture example; no selection mutation is sent by this native slice")
            }

        case .group(.stage):
            emptyPanelMessage("No mapped choices in this fixture.", symbol: "rectangle.3.group", tint: .purple)

        case .group(.finish):
            emptyPanelMessage("No mapped choices in this fixture.", symbol: "circle.dotted", tint: .orange)

        case .ratio:
            outputPanelMessage(
                title: "\(ratioValue) aspect ratio",
                symbol: "rectangle.portrait",
                tint: .cyan,
                note: "UI hook only — the native draft bridge remains unchanged."
            )

        case .resolution:
            outputPanelMessage(
                title: "\(resolutionValue) resolution target",
                symbol: "square.resize",
                tint: .blue,
                note: "UI hook only — the native draft bridge remains unchanged."
            )

        case .reference:
            outputPanelMessage(
                title: "Reference binding hook",
                symbol: "photo.badge.plus",
                tint: .orange,
                note: "Future @ references can attach here without changing compiler semantics."
            )
        }
    }

    private func emptyPanelMessage(_ message: String, symbol: String, tint: Color) -> some View {
        HStack(spacing: 10) {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 34, height: 34)
                .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .accessibilityHidden(true)

            Text(message)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func outputPanelMessage(title: String, symbol: String, tint: Color, note: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 34, height: 34)
                .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                Text(note)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var promptAndActions: some View {
        HStack(alignment: .bottom, spacing: 12) {
            VStack(alignment: .leading, spacing: 9) {
                TextField("Describe the subject, action, and scene", text: $what, axis: .vertical)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .textFieldStyle(.plain)
                    .lineLimit(2...6)
                    .fixedSize(horizontal: false, vertical: true)
                    .focused($focusedElement, equals: .prompt)
                    .accessibilityIdentifier("cue-what")
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity, minHeight: 76, alignment: .topLeading)
                    .background(Color.white.opacity(0.075), in: RoundedRectangle(cornerRadius: 17, style: .continuous))
                    .accessibilityLabel("Prompt")
                    .accessibilityHint("Describe the subject, action, and scene")

                HStack(spacing: 7) {
                    promptHookButton(symbol: "/", label: "Slash commands", focus: .slash, assist: .slash)
                    promptHookButton(symbol: "@", label: "Reference mentions", focus: .mention, assist: .mention)
                    Text("Future hooks")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)

                    if let promptAssist {
                        Text(promptAssist.title)
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundStyle(.cyan)
                            .transition(.opacity)
                    }
                }
                .animation(surfaceAnimation, value: promptAssist)

                if promptAssist != nil {
                    Text("This native UI hook is visible without inserting or compiling a command.")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(.opacity)
                }
            }
            .layoutPriority(1)

            actionColumn
        }
        .padding(.top, activePanel == nil ? 12 : 0)
    }

    @ViewBuilder
    private func promptHookButton(symbol: String, label: String, focus: FocusTarget, assist: PromptAssist) -> some View {
        Button {
            withAnimation(surfaceAnimation) {
                promptAssist = promptAssist == assist ? nil : assist
            }
        } label: {
            Text(symbol)
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(.primary)
                .frame(width: 28, height: 24)
                .background(Color.white.opacity(promptAssist == assist ? 0.14 : 0.07), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focused($focusedElement, equals: focus)
        .accessibilityIdentifier(focus == .slash ? "cue-slash-hook" : "cue-mention-hook")
        .accessibilityLabel(label)
        .accessibilityHint("Future UI hook; no backend command is inserted")
        .help(label)
    }

    private var actionColumn: some View {
        VStack(spacing: 8) {
            Button(action: apply) {
                Image(systemName: applied ? "checkmark" : "arrow.up.forward")
                    .font(.system(size: 21, weight: .bold))
                    .foregroundStyle(Color.black)
                    .frame(width: 58, height: 58)
                    .background(Color.cyan.opacity(0.92), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
            .focused($focusedElement, equals: .apply)
            .accessibilityIdentifier("cue-apply")
            .accessibilityLabel(applied ? "Applied" : "Apply")
            .help(applied ? "Applied" : "Apply")

            Button(action: openPreview) {
                Image(systemName: previewVisible ? "eye.slash" : "eye")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 42, height: 36)
                    .background(Color.white.opacity(0.09), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .contentShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
            .focused($focusedElement, equals: .preview)
            .accessibilityIdentifier("cue-preview-action")
            .accessibilityLabel(previewVisible ? "Hide Preview" : "Preview")
            .help(previewVisible ? "Hide Preview" : "Preview")
        }
        .frame(width: 60)
    }

    private var previewSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Preview")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                Spacer(minLength: 0)
                Text("selectable")
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }

            ScrollView {
                Text(previewText)
                    .font(.system(.body, design: .monospaced))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
                    .padding(12)
            }
            .frame(maxHeight: 220)
            .background(Color.black.opacity(0.16), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .accessibilityIdentifier("cue-preview")
            .accessibilityLabel("Preview text")
        }
        .padding(.top, 14)
    }

    private var surfaceAnimation: Animation {
        reduceMotion
            ? .easeOut(duration: 0.08)
            : .spring(response: 0.34, dampingFraction: 0.76, blendDuration: 0.08)
    }

    private func togglePanel(_ panel: ConfigurationPanel) {
        withAnimation(surfaceAnimation) {
            previewVisible = false
            activePanel = activePanel == panel ? nil : panel
        }
    }

    private func dismissPanel() {
        withAnimation(surfaceAnimation) {
            activePanel = nil
        }
    }

    private func openPreview() {
        if previewVisible {
            withAnimation(surfaceAnimation) {
                previewVisible = false
            }
            return
        }

        previewText = bridge.preview().text
        withAnimation(surfaceAnimation) {
            activePanel = nil
            previewVisible = true
        }
    }

    private func apply() {
        snapshot = bridge.apply(
            NativeCueCommand(
                type: "set-what",
                expectedRevision: snapshot.draftRevision,
                value: what
            )
        )

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

private struct CueShellSurface<S: InsettableShape>: ViewModifier {
    let shape: S
    let tint: Color
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    func body(content: Content) -> some View {
        if #available(macOS 26.0, *), !reduceTransparency {
            content
                .background(shape.fill(Color.black.opacity(0.22)))
                .glassEffect(.regular.tint(tint.opacity(0.13)).interactive(), in: shape)
                .clipShape(shape)
                .shadow(color: .black.opacity(0.34), radius: 28, y: 15)
        } else {
            content
                .background(shape.fill(Color(red: 0.055, green: 0.075, blue: 0.12)))
                .clipShape(shape)
                .shadow(color: .black.opacity(0.42), radius: 24, y: 13)
        }
    }
}

private struct CleanButtonStyle: ButtonStyle {
    let reduceMotion: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.975 : 1)
            .animation(
                reduceMotion
                    ? .easeOut(duration: 0.08)
                    : .spring(response: 0.22, dampingFraction: 0.72, blendDuration: 0.08),
                value: configuration.isPressed
            )
    }
}
