import AppKit
import SwiftUI
import UniformTypeIdentifiers

private struct CueLeftBlockHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

struct CueView<Bridge: NativeRuntimeBridge>: View {
    private let accent = Color.orange

    private enum ParameterGroup: String, CaseIterable, Hashable {
        case optics
        case stage
        case finish

        var title: String { rawValue.capitalized }

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

        var title: String { rawValue.capitalized }
    }

    private enum ConfigurationPanel: Equatable {
        case group(ParameterGroup)

        var accessibilityIdentifier: String {
            switch self {
            case let .group(group): "cue-panel-\(group.rawValue)"
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
            case .slash, .mention, .preview, .apply:
                true
            case .prompt:
                true
            }
        }
    }

    private struct SelectorOption: Identifiable {
        let id: String
        let title: String
        let detail: String
        let symbol: String
        let assetName: String?
        let available: Bool
    }

    private struct ReferenceItem: Identifiable, Hashable {
        let id = UUID()
        let name: String
        let localURL: URL
    }

    private struct OpticsSlotOption: Identifiable {
        let id: String
        let title: String
        let symbol: String
        let assetName: String?
    }

    private let bridge: Bridge
    @State private var what = ""
    @State private var snapshot: NativeBootstrap
    @State private var previewText = ""
    @State private var activePanel: ConfigurationPanel?
    @State private var previewVisible = false
    @State private var applied = false
    @State private var editPending = false
    @State private var promptHovered = false
    @State private var panelHovered = false
    @State private var hoveredGroup: ParameterGroup?
    @State private var promptHeight: CGFloat = 0
    @State private var ratioValue = "4:5"
    @State private var resolutionValue = "2K"
    @State private var mode: ComposerMode
    @State private var editGroups: Set<ParameterGroup> = []
    @State private var selectedOptions: [ParameterGroup: String] = [
        .optics: "natural50"
    ]
    @State private var references: [ReferenceItem] = []
    @State private var opticsSelections: [String: String] = [
        "camera": "modern",
        "lens": "natural",
        "aperture": "auto"
    ]
    @Namespace private var modePuck
    @FocusState private var focusedElement: FocusTarget?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    init(bridge: Bridge) {
        self.bridge = bridge
        let initialSnapshot = bridge.bootstrap()
        _snapshot = State(initialValue: initialSnapshot)
        _previewText = State(initialValue: bridge.preview().text)
        _mode = State(initialValue: ComposerMode(rawValue: initialSnapshot.activeMode) ?? .create)
    }

    private var controlsExpanded: Bool {
        promptHovered || activePanel != nil || focusedElement?.revealsControls == true
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .bottom, spacing: 12) {
                leftComposer
                    .frame(maxWidth: .infinity, alignment: .leading)

                actionColumn
                    .frame(
                        width: 96,
                        height: controlsExpanded ? max(promptHeight + controlsOverlayHeight, 140) : 0,
                        alignment: .bottom
                    )
                    .opacity(controlsExpanded ? 1 : 0)
                    .scaleEffect(controlsExpanded ? 1 : 0.55, anchor: .leading)
                    .allowsHitTesting(controlsExpanded)
            }

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
        .background(Color.clear.contentShape(Rectangle()))
        .onTapGesture {
            if activePanel != nil {
                dismissPanel()
            }
        }
        .frame(minWidth: 500, idealWidth: 700, maxWidth: 820, alignment: .leading)
        .onPreferenceChange(CueLeftBlockHeightKey.self) { height in
            promptHeight = height
        }
        .animation(surfaceAnimation, value: controlsExpanded)
        .animation(surfaceAnimation, value: previewVisible)
        .animation(surfaceAnimation, value: mode)
        .defaultFocus($focusedElement, .prompt)
        .onExitCommand(perform: dismissPanel)
        .onReceive(NotificationCenter.default.publisher(for: .cueDismissPanel)) { _ in
            dismissPanel()
        }
    }

    private var modeSwitch: some View {
        HStack(spacing: 3) {
            ForEach(ComposerMode.allCases, id: \.self) { option in
                Button {
                    withAnimation(surfaceAnimation) {
                        mode = option
                        activePanel = nil
                        editGroups = []
                        editPending = false
                    }
                } label: {
                    ZStack {
                        if mode == option {
                            Color.clear
                                .cueGlass(
                                    in: Capsule(),
                                    tint: accent,
                                    interactive: true,
                                    reduceTransparency: reduceTransparency
                                )
                                .matchedGeometryEffect(id: "mode-puck", in: modePuck)
                        }

                        Text(option.title)
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(mode == option ? Color.black : Color.primary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 32)
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
        .frame(width: 176, height: 40)
        .cueGlass(
            in: Capsule(),
            interactive: true,
            reduceTransparency: reduceTransparency
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("cue-mode-switch")
    }

    private var leftComposer: some View {
        promptBar
            .overlay(alignment: .topLeading) {
                if controlsExpanded {
                    expandedControls
                        .offset(y: -(controlsOverlayHeight + 10))
                        .transition(
                            reduceMotion
                                ? .opacity
                                : .scale(scale: 0.98, anchor: .bottom).combined(with: .opacity)
                        )
                }
            }
            .background(
                GeometryReader { proxy in
                    Color.clear.preference(key: CueLeftBlockHeightKey.self, value: proxy.size.height)
                }
            )
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var expandedControls: some View {
        VStack(alignment: .leading, spacing: 10) {
            modeSwitch

            if let activePanel {
                configurationPanel(for: activePanel)
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .scale(scale: 0.98, anchor: .bottom).combined(with: .opacity)
                    )
            }

            configurationArea
                .transition(reduceMotion ? .opacity : .scale(scale: 0.96, anchor: .bottom).combined(with: .opacity))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var controlsOverlayHeight: CGFloat {
        let baseHeight: CGFloat = 40 + 10 + 58
        guard let activePanel else { return baseHeight }

        switch activePanel {
        case .group(.optics):
            return baseHeight + 10 + 74
        case .group(.stage), .group(.finish):
            return baseHeight + 10 + 213
        }
    }

    private var configurationArea: some View {
        HStack(spacing: 9) {
            ForEach(ParameterGroup.allCases, id: \.self) { group in
                parameterButton(for: group)
            }
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func parameterButton(for group: ParameterGroup) -> some View {
        let isOpen = activePanel == .group(group)
        let selectedOption = selectedOptions[group]

        Button {
            focusedElement = .group(group)
            previewVisible = false
        } label: {
            HStack(spacing: 8) {
                nativeAsset(named: group.assetName)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 38, height: 38)
                    .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(group.title)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)

                }

                Spacer(minLength: 0)

                Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 8)
            .frame(maxWidth: .infinity, minHeight: 58, alignment: .leading)
            .cueGlass(
                in: RoundedRectangle(cornerRadius: 16, style: .continuous),
                tint: isOpen ? accent.opacity(0.42) : nil,
                interactive: true,
                reduceTransparency: reduceTransparency
            )
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focusEffectDisabled()
        .focused($focusedElement, equals: .group(group))
        .onHover { isHovered in
            if isHovered {
                hoveredGroup = group
                withAnimation(surfaceAnimation) {
                    activePanel = .group(group)
                    previewVisible = false
                }
            } else if hoveredGroup == group {
                hoveredGroup = nil
                schedulePanelDismissal()
            }
        }
        .accessibilityIdentifier("cue-group-\(group.rawValue)")
        .accessibilityLabel(group.title)
        .accessibilityValue(
            isOpen ? "expanded" : selectedOption == nil ? "not configured" : "configured"
        )
        .accessibilityHint(
            mode == .edit
                ? "Hover to show choices. Choose an option to add this edit operation."
                : "Hover to show \(group.title) choices"
        )
        .help(group.title)
    }

    @ViewBuilder
    private func outputButton(
        value: String,
        symbol: String,
        focus: FocusTarget,
        options: [String]
    ) -> some View {
        Menu {
            ForEach(options, id: \.self) { option in
                Button(option) {
                    dismissPanel()
                    if focus == .ratio {
                        ratioValue = option
                    } else {
                        resolutionValue = option
                    }
                }
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: symbol)
                    .font(.system(size: 12, weight: .semibold))
                    .accessibilityHidden(true)

                Text(value)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .lineLimit(1)

                Image(systemName: "chevron.down")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
            .foregroundStyle(.primary)
            .padding(.horizontal, 9)
            .frame(minWidth: 66, minHeight: 34)
            .cueGlass(
                in: RoundedRectangle(cornerRadius: 11, style: .continuous),
                interactive: true,
                reduceTransparency: reduceTransparency
            )
            .contentShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
        }
        .menuStyle(.borderlessButton)
        .focused($focusedElement, equals: focus)
        .accessibilityIdentifier(focus == .ratio ? "cue-ratio" : "cue-resolution")
        .accessibilityLabel(focus == .ratio ? "Ratio, \(value)" : "Resolution, \(value)")
        .accessibilityHint("Choose a value")
        .help(value)
    }

    private var referenceButton: some View {
        Button {
            focusedElement = .reference
            dismissPanel()
            addReference()
        } label: {
            Image(systemName: "photo.badge.plus")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(width: 38, height: 34)
                .cueGlass(
                    in: RoundedRectangle(cornerRadius: 11, style: .continuous),
                    tint: references.isEmpty ? nil : accent.opacity(0.42),
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
                .contentShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .focused($focusedElement, equals: .reference)
        .accessibilityIdentifier("cue-add-reference")
        .accessibilityLabel("Add Reference")
        .accessibilityValue(references.isEmpty ? "none added" : "\(references.count) added")
        .accessibilityHint("Choose a local image or video and make it available to the at-mention menu")
        .help("Add Reference")
    }

    @ViewBuilder
    private func configurationPanel(for panel: ConfigurationPanel) -> some View {
        if case let .group(group) = panel {
            VStack(alignment: .leading, spacing: 9) {
                switch group {
                case .optics:
                    opticsSelector
                case .stage, .finish:
                    LazyVGrid(
                        columns: Array(repeating: GridItem(.flexible(), spacing: 9), count: 4),
                        spacing: 9
                    ) {
                        ForEach(options(for: group)) { option in
                            selectorCard(option, group: group)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .onHover { isHovered in
                panelHovered = isHovered
                if !isHovered {
                    schedulePanelDismissal()
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier(panel.accessibilityIdentifier)
            .accessibilityLabel("\(group.title) selection")
        }
    }

    private var opticsSelector: some View {
        HStack(spacing: 9) {
            opticsSlot(
                title: "Camera",
                key: "camera",
                options: [
                    OpticsSlotOption(id: "modern", title: "Modern", symbol: "camera.aperture", assetName: "group-optics-v2"),
                    OpticsSlotOption(id: "film35", title: "35mm Film", symbol: "film", assetName: nil)
                ]
            )
            opticsSlot(
                title: "Lens",
                key: "lens",
                options: [
                    OpticsSlotOption(id: "natural", title: "Natural", symbol: "camera.macro", assetName: nil),
                    OpticsSlotOption(id: "wide", title: "Wide", symbol: "camera.aperture", assetName: nil)
                ]
            )
            opticsSlot(
                title: "Aperture",
                key: "aperture",
                options: [
                    OpticsSlotOption(id: "auto", title: "Auto", symbol: "circle.lefthalf.filled", assetName: nil),
                    OpticsSlotOption(id: "deep", title: "Deep focus", symbol: "circle.dotted", assetName: nil)
                ]
            )
        }
        .frame(maxWidth: .infinity)
    }

    private func opticsSlot(
        title: String,
        key: String,
        options: [OpticsSlotOption]
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)

            Menu {
                ForEach(options) { option in
                    Button(option.title) {
                        opticsSelections[key] = option.id
                        selectedOptions[.optics] = "optics"
                        if mode == .edit {
                            editGroups.insert(.optics)
                            editPending = false
                        }
                    }
                }
            } label: {
                let selectedID = opticsSelections[key] ?? options[0].id
                let selected = options.first(where: { $0.id == selectedID }) ?? options[0]

                HStack(spacing: 7) {
                    if let assetName = selected.assetName {
                        nativeAsset(named: assetName)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 34, height: 34)
                            .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
                    } else {
                        Image(systemName: selected.symbol)
                            .font(.system(size: 16, weight: .medium))
                            .frame(width: 34, height: 34)
                    }

                    Text(selected.title)
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .lineLimit(1)

                    Spacer(minLength: 0)

                    Image(systemName: "chevron.down")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(.secondary)
                }
                .foregroundStyle(.primary)
                .padding(7)
                .frame(maxWidth: .infinity, minHeight: 50)
                .cueGlass(
                    in: RoundedRectangle(cornerRadius: 13, style: .continuous),
                    tint: selectedOptions[.optics] == "optics" ? accent.opacity(0.42) : nil,
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
            }
            .menuStyle(.borderlessButton)
            .accessibilityLabel(title)
            .accessibilityValue(options.first(where: { $0.id == (opticsSelections[key] ?? "") })?.title ?? "not configured")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func selectorCard(_ option: SelectorOption, group: ParameterGroup) -> some View {
        let isSelected = selectedOptions[group] == option.id

        return Button {
            guard option.available else { return }
            selectedOptions[group] = option.id
            if mode == .edit {
                editGroups.insert(group)
                editPending = false
            }
        } label: {
            VStack(alignment: .leading, spacing: 5) {
                ZStack(alignment: .topTrailing) {
                    if let assetName = option.assetName {
                        nativeAsset(named: assetName)
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity, minHeight: 58, maxHeight: 58)
                            .clipped()
                    } else {
                        Image(systemName: option.symbol)
                            .font(.system(size: 24, weight: .medium))
                            .foregroundStyle(option.available ? .primary : .secondary)
                            .frame(maxWidth: .infinity, minHeight: 58, maxHeight: 58)
                    }

                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(accent)
                            .padding(7)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                Text(option.title)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Text(option.detail)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .padding(8)
            .frame(maxWidth: .infinity, minHeight: 102, alignment: .leading)
            .opacity(option.available ? 1 : 0.48)
            .cueGlass(
                in: RoundedRectangle(cornerRadius: 14, style: .continuous),
                tint: isSelected ? accent.opacity(0.42) : nil,
                interactive: option.available,
                reduceTransparency: reduceTransparency
            )
        }
        .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
        .disabled(!option.available)
        .accessibilityLabel(option.title)
        .accessibilityValue(isSelected ? "selected" : option.available ? option.detail : "unavailable")
    }

    private func options(for group: ParameterGroup) -> [SelectorOption] {
        switch group {
        case .optics:
            [
                SelectorOption(
                    id: "natural50",
                    title: "Natural 50",
                    detail: "Balanced perspective",
                    symbol: "camera.aperture",
                    assetName: group.assetName,
                    available: true
                ),
                SelectorOption(
                    id: "film35",
                    title: "35mm Film",
                    detail: "Unavailable",
                    symbol: "film",
                    assetName: nil,
                    available: false
                ),
                SelectorOption(
                    id: "wide24",
                    title: "Wide 24",
                    detail: "Unavailable",
                    symbol: "camera.aperture",
                    assetName: nil,
                    available: false
                )
            ]
        case .stage:
            [
                SelectorOption(
                    id: "centered",
                    title: "Centered",
                    detail: "Balanced frame",
                    symbol: "square.grid.3x3",
                    assetName: group.assetName,
                    available: true
                ),
                SelectorOption(
                    id: "portrait",
                    title: "Portrait frame",
                    detail: "Subject-led",
                    symbol: "rectangle.portrait",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "negativeSpace",
                    title: "Negative space",
                    detail: "Air around subject",
                    symbol: "rectangle.dashed",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "closeCrop",
                    title: "Close crop",
                    detail: "Tight framing",
                    symbol: "viewfinder",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "wideScene",
                    title: "Wide scene",
                    detail: "Environment-led",
                    symbol: "rectangle.expand.vertical",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "overhead",
                    title: "Overhead",
                    detail: "Top-down frame",
                    symbol: "arrow.down.to.line",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "lowAngle",
                    title: "Low angle",
                    detail: "Grounded frame",
                    symbol: "arrow.up.to.line",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "detail",
                    title: "Detail",
                    detail: "Element-led frame",
                    symbol: "viewfinder.circle",
                    assetName: nil,
                    available: true
                )
            ]
        case .finish:
            [
                SelectorOption(
                    id: "neutral",
                    title: "Neutral",
                    detail: "Natural grade",
                    symbol: "circle.lefthalf.filled",
                    assetName: group.assetName,
                    available: true
                ),
                SelectorOption(
                    id: "contrast",
                    title: "Contrast",
                    detail: "Harder separation",
                    symbol: "circle.lefthalf.striped.horizontal",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "mono",
                    title: "Monochrome",
                    detail: "Single-channel grade",
                    symbol: "circle.righthalf.filled",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "warm",
                    title: "Warm",
                    detail: "Amber bias",
                    symbol: "sun.max",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "cool",
                    title: "Cool",
                    detail: "Blue bias",
                    symbol: "snowflake",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "matte",
                    title: "Matte",
                    detail: "Soft highlights",
                    symbol: "circle.dashed",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "bleach",
                    title: "Bleach",
                    detail: "Muted color",
                    symbol: "drop.halffull",
                    assetName: nil,
                    available: true
                ),
                SelectorOption(
                    id: "neon",
                    title: "Neon",
                    detail: "Luminous color",
                    symbol: "lightbulb",
                    assetName: nil,
                    available: true
                )
            ]
        }
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
                .onTapGesture {
                    if activePanel != nil {
                        dismissPanel()
                    }
                }

            HStack(spacing: 6) {
                referenceButton

                outputButton(
                    value: ratioValue,
                    symbol: "aspectratio",
                    focus: .ratio,
                    options: ["1:1", "4:5", "16:9"]
                )

                outputButton(
                    value: resolutionValue,
                    symbol: "4k.tv",
                    focus: .resolution,
                    options: ["1K", "2K", "4K"]
                )

                Spacer(minLength: 0)

                slashMenu
                mentionMenu
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cueGlass(
            in: RoundedRectangle(cornerRadius: 17, style: .continuous),
            interactive: true,
            reduceTransparency: reduceTransparency
        )
        .contentShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
        .onHover { isHovered in
            promptHovered = isHovered
        }
        .simultaneousGesture(
            TapGesture().onEnded {
                if activePanel != nil {
                    dismissPanel()
                }
            }
        )
        .accessibilityIdentifier("cue-prompt-bar")
    }

    private var slashMenu: some View {
        Menu {
            Button("Open Optics") { openGroupPanel(.optics) }
            Button("Open Stage") { openGroupPanel(.stage) }
            Button("Open Finish") { openGroupPanel(.finish) }
            Divider()
            Button(mode == .create ? "Switch to Edit" : "Switch to Create") {
                withAnimation(surfaceAnimation) {
                    mode = mode == .create ? .edit : .create
                    editGroups = []
                    editPending = false
                }
            }
        } label: {
            promptHookLabel(symbol: "/", active: false)
        }
        .menuStyle(.borderlessButton)
        .focused($focusedElement, equals: .slash)
        .accessibilityIdentifier("cue-slash-hook")
        .accessibilityLabel("Slash commands")
        .accessibilityHint("Open native composer commands")
        .help("Commands")
    }

    private var mentionMenu: some View {
        Menu {
            if references.isEmpty {
                Text("No references")
            } else {
                ForEach(references) { reference in
                    Button("@\(reference.name)") {
                        insertReference(reference)
                    }
                }
            }
            Divider()
            Button("Add Reference…") { addReference() }
        } label: {
            promptHookLabel(symbol: "@", active: !references.isEmpty)
        }
        .menuStyle(.borderlessButton)
        .focused($focusedElement, equals: .mention)
        .accessibilityIdentifier("cue-mention-hook")
        .accessibilityLabel("Reference mentions")
        .accessibilityHint("Insert a local reference mention into the prompt")
        .help("References")
    }

    private func promptHookLabel(symbol: String, active: Bool) -> some View {
        Text(symbol)
            .font(.system(size: 13, weight: .bold, design: .monospaced))
            .foregroundStyle(.primary)
            .frame(width: 34, height: 34)
            .cueGlass(
                in: RoundedRectangle(cornerRadius: 9, style: .continuous),
                tint: active ? accent.opacity(0.42) : nil,
                interactive: true,
                reduceTransparency: reduceTransparency
            )
            .contentShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
    }

    private var actionColumn: some View {
        VStack(spacing: 8) {
            Button(action: apply) {
                VStack(spacing: 6) {
                    Image(systemName: editPending ? "clock" : applied ? "checkmark" : "arrow.up.forward")
                        .font(.system(size: 24, weight: .bold))
                    Text(editPending ? "Pending" : applied ? "Applied" : "Apply")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                }
                .foregroundStyle(Color.black)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .cueGlass(
                    in: RoundedRectangle(cornerRadius: 18, style: .continuous),
                    tint: accent,
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
                .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
            .focused($focusedElement, equals: .apply)
            .accessibilityIdentifier("cue-apply")
            .accessibilityLabel(editPending ? "Edit pending" : applied ? "Applied" : "Apply")
            .accessibilityHint(mode == .edit ? "Edit operations remain local until the native edit bridge exists" : "Apply the current prompt")
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button(action: openPreview) {
                Image(systemName: previewVisible ? "eye.slash" : "eye")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(maxWidth: .infinity, minHeight: 34)
                    .cueGlass(
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous),
                        interactive: true,
                        reduceTransparency: reduceTransparency
                    )
                    .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(CleanButtonStyle(reduceMotion: reduceMotion))
            .focused($focusedElement, equals: .preview)
            .accessibilityIdentifier("cue-preview-action")
            .accessibilityLabel(previewVisible ? "Hide Preview" : "Preview")
            .help(previewVisible ? "Hide Preview" : "Preview")
        }
        .frame(maxHeight: .infinity, alignment: .top)
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
            .cueGlass(
                in: RoundedRectangle(cornerRadius: 16, style: .continuous),
                interactive: false,
                reduceTransparency: reduceTransparency
            )
            .accessibilityIdentifier("cue-preview")
            .accessibilityLabel("Preview text")
        }
        .padding(.top, 14)
    }

    private var surfaceAnimation: Animation {
        reduceMotion
            ? .easeOut(duration: 0.08)
            : .spring(response: 0.42, dampingFraction: 0.72, blendDuration: 0.1)
    }

    private func openGroupPanel(_ group: ParameterGroup) {
        withAnimation(surfaceAnimation) {
            activePanel = .group(group)
            panelHovered = true
            previewVisible = false
        }
    }

    private func dismissPanel() {
        withAnimation(surfaceAnimation) {
            activePanel = nil
            panelHovered = false
            hoveredGroup = nil
        }
    }

    private func schedulePanelDismissal() {
        let panelAtSchedule = activePanel
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.42) {
            guard activePanel == panelAtSchedule,
                  !panelHovered,
                  hoveredGroup == nil else { return }
            dismissPanel()
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
        guard mode == .create else {
            withAnimation(surfaceAnimation) {
                editPending = true
                activePanel = nil
            }
            return
        }

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

    private func addReference() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image, .movie]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.prompt = "Add Reference"

        guard panel.runModal() == .OK, let url = panel.url else { return }
        let name = url.deletingPathExtension().lastPathComponent
        guard !name.isEmpty else { return }

        let reference = ReferenceItem(name: name, localURL: url)
        references.append(reference)
        insertReference(reference)
    }

    private func insertReference(_ reference: ReferenceItem) {
        dismissPanel()
        let token = "@\(reference.name.replacingOccurrences(of: " ", with: "_"))"
        if !what.isEmpty && !what.hasSuffix(" ") {
            what.append(" ")
        }
        what.append(token)
        focusedElement = .prompt
    }
}

private extension View {
    @ViewBuilder
    func cueGlass<S: Shape>(
        in shape: S,
        tint: Color? = nil,
        interactive: Bool,
        reduceTransparency: Bool
    ) -> some View {
        if reduceTransparency {
            background(Color(nsColor: .controlBackgroundColor).opacity(0.92), in: shape)
                .overlay(shape.stroke(Color(nsColor: .separatorColor).opacity(0.78), lineWidth: 1))
        } else {
            glassEffect(
                .regular.tint(tint).interactive(interactive),
                in: shape
            )
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
