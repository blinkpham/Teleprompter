import AppKit
import SwiftUI

struct CueView<Bridge: NativeRuntimeBridge>: View {
    private let accent = Color.orange

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

        var assetName: String {
            switch self {
            case .optics: "group-optics-v2"
            case .stage: "group-stage-v2"
            case .finish: "group-finish-v2"
            }
        }
    }

    private enum ComposerMode: String, CaseIterable, Hashable {
        case create
        case edit

        var title: String {
            rawValue.capitalized
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
    @State private var mode: ComposerMode
    @State private var editGroups: Set<ParameterGroup> = []
    @FocusState private var focusedElement: FocusTarget?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(bridge: Bridge) {
        self.bridge = bridge
        let initialSnapshot = bridge.bootstrap()
        _snapshot = State(initialValue: initialSnapshot)
        _previewText = State(initialValue: bridge.preview().text)
        _mode = State(initialValue: ComposerMode(rawValue: initialSnapshot.activeMode) ?? .create)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            modeSwitch

            HStack(alignment: .top, spacing: 12) {
                leftComposer
                actionColumn
                    .frame(width: 92)
                    .frame(maxHeight: .infinity, alignment: .top)
            }
            .padding(.top, 12)
            .fixedSize(horizontal: false, vertical: true)

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
        .animation(surfaceAnimation, value: activePanel)
        .animation(surfaceAnimation, value: previewVisible)
        .animation(surfaceAnimation, value: mode)
        .defaultFocus($focusedElement, .prompt)
        .onExitCommand(perform: dismissPanel)
    }

    private var modeSwitch: some View {
        HStack(spacing: 3) {
            ForEach(ComposerMode.allCases, id: \.self) { option in
                Button {
                    withAnimation(surfaceAnimation) {
                        mode = option
                        activePanel = nil
                        editGroups = []
                    }
                } label: {
                    Text(option.title)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(mode == option ? Color.black : Color.primary)
                        .frame(width: 78, height: 30)
                        .background(
                            mode == option ? accent : Color.clear,
                            in: Capsule()
                        )
                }
                .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
                .focusEffectDisabled()
                .accessibilityIdentifier("cue-mode-\(option.rawValue)")
                .accessibilityAddTraits(mode == option ? .isSelected : [])
                .accessibilityHint(
                    option == .edit
                        ? "Edit mode supports selecting multiple change operations"
                        : "Create mode builds a new prompt"
                )
            }
        }
        .padding(3)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("cue-mode-switch")
    }

    private var leftComposer: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let activePanel {
                configurationPanel(for: activePanel)
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .move(edge: .bottom).combined(with: .opacity)
                    )
            }

            configurationArea
            promptBar
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var configurationArea: some View {
        HStack(spacing: 9) {
            ForEach(ParameterGroup.allCases, id: \.self) { group in
                parameterButton(for: group)
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

    @ViewBuilder
    private func parameterButton(for group: ParameterGroup) -> some View {
        let isOpen = activePanel == .group(group)
        let isSelected = mode == .edit && editGroups.contains(group)

        Button {
            focusedElement = .group(group)
            withAnimation(surfaceAnimation) {
                if mode == .edit {
                    editGroups.formSymmetricDifference([group])
                }
                activePanel = isOpen ? nil : .group(group)
                previewVisible = false
            }
        } label: {
            HStack(spacing: 8) {
                nativeAsset(named: group.assetName)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 44, height: 42)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(group.title)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)
                        .allowsTightening(true)

                }

                Spacer(minLength: 0)

                Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .opacity(controlsRevealed || isOpen ? 1 : 0.55)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 9)
            .frame(maxWidth: .infinity, minHeight: controlsRevealed || isOpen ? 62 : 52, alignment: .leading)
            .background(
                accent.opacity(isSelected ? 0.18 : isOpen ? 0.13 : 0.075),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focusEffectDisabled()
        .focused($focusedElement, equals: .group(group))
        .onHover { isHovered in
            controlsHovered = isHovered
            if isHovered && !isOpen {
                withAnimation(surfaceAnimation) {
                    activePanel = .group(group)
                    previewVisible = false
                }
            }
        }
        .accessibilityIdentifier("cue-group-\(group.rawValue)")
        .accessibilityLabel(group.title)
        .accessibilityValue(
            isSelected
                ? "selected edit operation, \(group.axisTitle)"
                : isOpen ? "\(group.axisTitle), expanded" : "\(group.axisTitle), collapsed"
        )
        .accessibilityHint(
            mode == .edit
                ? "Selects or removes this edit operation and shows its choices"
                : "Shows \(group.title) choices"
        )
        .help(group.title)
    }

    @ViewBuilder
    private func outputButton(
        title: String,
        value: String,
        symbol: String,
        panel: ConfigurationPanel,
        focus: FocusTarget
    ) -> some View {
        Menu {
            switch panel {
            case .ratio:
                ForEach(["1:1", "4:5", "16:9"], id: \.self) { option in
                    Button(option) {
                        ratioValue = option
                    }
                }
            case .resolution:
                ForEach(["1K", "2K", "4K"], id: \.self) { option in
                    Button(option) {
                        resolutionValue = option
                    }
                }
            default:
                Button(value) {}
                    .disabled(true)
            }
        } label: {
            HStack(spacing: 7) {
                Image(systemName: symbol)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)

                Text(value)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)

                Image(systemName: "chevron.down")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 10)
            .frame(maxWidth: .infinity, minHeight: 34)
            .background(
                Color.white.opacity(0.06),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .menuStyle(.borderlessButton)
        .focused($focusedElement, equals: focus)
        .accessibilityIdentifier(
            panel == .ratio ? "cue-ratio" : panel == .resolution ? "cue-resolution" : "cue-output-control"
        )
        .accessibilityLabel("\(title), \(value), UI only")
        .accessibilityHint("UI-only affordance; not saved or sent to the bridge")
        .help("\(title): \(value)")
    }

    private var referenceButton: some View {
        return Button {
            focusedElement = .reference
            withAnimation(surfaceAnimation) {
                promptAssist = promptAssist == .mention ? nil : .mention
            }
        } label: {
            Image(systemName: "photo.badge.plus")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(width: 38, height: 34)
                .background(
                    Color.white.opacity(promptAssist == .mention ? 0.13 : 0.06),
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
        if case let .group(group) = panel {
            HStack(spacing: 8) {
                switch group {
                case .optics:
                    selectorSlot("Natural 50", selected: true)
                case .stage, .finish:
                    selectorEmptySlot
                }

                Spacer(minLength: 0)

                Button(action: dismissPanel) {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .frame(width: 30, height: 34)
                        .contentShape(Rectangle())
                }
                .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
                .accessibilityLabel("Close selection")
                .help("Close")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier(panel.accessibilityIdentifier)
            .accessibilityLabel("\(group.title) selection")
        }
    }

    private func selectorSlot(_ value: String, selected: Bool) -> some View {
        Button(action: {}) {
            HStack(spacing: 8) {
                Circle()
                    .fill(selected ? accent : Color.white.opacity(0.22))
                    .frame(width: 8, height: 8)
                    .accessibilityHidden(true)

                Text(value)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                if selected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(accent)
                        .accessibilityHidden(true)
                }
            }
            .padding(.horizontal, 13)
            .frame(minHeight: 38)
            .background(
                selected ? accent.opacity(0.15) : Color.white.opacity(0.06),
                in: RoundedRectangle(cornerRadius: 13, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .accessibilityLabel(value)
        .accessibilityValue(selected ? "selected" : "not selected")
        .accessibilityHint("Fixture option; compiler selection is not wired in this native slice")
    }

    private var selectorEmptySlot: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color.white.opacity(0.18))
                .frame(width: 8, height: 8)
                .accessibilityHidden(true)

            Text("—")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 13)
        .frame(minHeight: 38)
        .background(
            Color.white.opacity(0.04),
            in: RoundedRectangle(cornerRadius: 13, style: .continuous)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("No mapped option")
    }

    private func nativeAsset(named name: String) -> Image {
        guard let path = Bundle.main.path(forResource: name, ofType: "png"),
              let image = NSImage(contentsOfFile: path) else {
            return Image(systemName: "photo")
        }
        return Image(nsImage: image)
    }

    private var promptBar: some View {
        VStack(alignment: .leading, spacing: 10) {
            TextField("Describe the subject, action, and scene", text: $what, axis: .vertical)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .textFieldStyle(.plain)
                .lineLimit(1...6)
                .fixedSize(horizontal: false, vertical: true)
                .focused($focusedElement, equals: .prompt)
                .accessibilityIdentifier("cue-what")
                .frame(maxWidth: .infinity, minHeight: 62, alignment: .topLeading)
                .accessibilityLabel("Prompt")
                .accessibilityHint("Describe the subject, action, and scene")

            HStack(spacing: 6) {
                outputButton(title: "Ratio", value: ratioValue, symbol: "rectangle.portrait", panel: .ratio, focus: .ratio)
                    .frame(width: 72)
                outputButton(title: "Resolution", value: resolutionValue, symbol: "square.resize", panel: .resolution, focus: .resolution)
                    .frame(width: 72)
                referenceButton

                Spacer(minLength: 0)

                promptHookButton(symbol: "/", label: "Slash commands", focus: .slash, assist: .slash)
                promptHookButton(symbol: "@", label: "Reference mentions", focus: .mention, assist: .mention)
            }

        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            Color.white.opacity(0.075),
            in: RoundedRectangle(cornerRadius: 17, style: .continuous)
        )
        .animation(surfaceAnimation, value: promptAssist)
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
                .frame(width: 34, height: 34)
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
                VStack(spacing: 6) {
                    Image(systemName: applied ? "checkmark" : "arrow.up.forward")
                        .font(.system(size: 24, weight: .bold))
                    Text(applied ? "Applied" : "Apply")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                }
                .foregroundStyle(Color.black)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(accent, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
            .focused($focusedElement, equals: .apply)
            .accessibilityIdentifier("cue-apply")
            .accessibilityLabel(applied ? "Applied" : "Apply")
            .help(applied ? "Applied" : "Apply")
            .frame(maxWidth: .infinity)

            Button(action: openPreview) {
                Image(systemName: previewVisible ? "eye.slash" : "eye")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(maxWidth: .infinity, minHeight: 34)
                    .background(Color.white.opacity(0.09), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .contentShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
            .focused($focusedElement, equals: .preview)
            .accessibilityIdentifier("cue-preview-action")
            .accessibilityLabel(previewVisible ? "Hide Preview" : "Preview")
            .help(previewVisible ? "Hide Preview" : "Preview")
        }
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
