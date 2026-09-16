import AppKit
import SwiftUI
import UniformTypeIdentifiers

private struct MainLeftBlockHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

@MainActor
final class MainWindowController<Bridge: NativeRuntimeBridge>: NSObject, NSWindowDelegate {
    private let window: NSWindow

    init(bridge: Bridge) {
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1120, height: 760),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        super.init()

        window.title = "Teleprompter"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.toolbarStyle = .unifiedCompact
        window.isOpaque = false
        window.backgroundColor = .clear
        window.isMovableByWindowBackground = true
        window.minSize = NSSize(width: 900, height: 620)
        window.delegate = self
        window.contentView = NSHostingView(rootView: MainWorkspaceView(bridge: bridge))
    }

    func show() {
        guard let screen = NSScreen.main else { return }
        window.center()
        if !screen.visibleFrame.contains(window.frame.origin) {
            window.center()
        }
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}

private enum WorkspaceSection: String, CaseIterable, Identifiable {
    case cue
    case gallery
    case tokens

    var id: String { rawValue }
    var title: String { rawValue.capitalized }

    var symbol: String {
        switch self {
        case .cue: "wand.and.stars"
        case .gallery: "square.grid.2x2"
        case .tokens: "textformat.abc"
        }
    }
}

private enum MainComposerMode: String, CaseIterable, Identifiable {
    case create
    case edit

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
}

private enum MainParameter: String, CaseIterable, Identifiable {
    case optics
    case stage
    case finish

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .optics: "camera.aperture"
        case .stage: "rectangle.inset.filled"
        case .finish: "circle.lefthalf.filled"
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

private enum MainCueSheet: String, Identifiable {
    case optics
    case stage
    case finish

    var id: String { rawValue }
    var parameter: MainParameter { MainParameter(rawValue: rawValue)! }
}

private struct MainReference: Identifiable {
    let slot: CueReferenceSlot
    let localURL: URL

    var id: Int { slot.imageNumber }
}

struct MainWorkspaceView<Bridge: NativeRuntimeBridge>: View {
    let bridge: Bridge
    @State private var section: WorkspaceSection = .cue
    @State private var pendingInsertion = ""
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        HStack(spacing: 0) {
            sidebar
                .frame(width: 218)

            Divider()

            Group {
                switch section {
                case .cue:
                    FixedCueView(bridge: bridge, pendingInsertion: $pendingInsertion)
                case .gallery:
                    GalleryView()
                case .tokens:
                    TokenDictionaryView { token in
                        if let definition = TokenDefinition(token: token),
                           let insertion = definition.insertion(for: .slash),
                           case let .slash(form) = insertion {
                            pendingInsertion = form.triggerText
                        } else {
                            pendingInsertion = token.shorthand
                        }
                        section = .cue
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(.ultraThinMaterial)
        .preferredColorScheme(.dark)
        .frame(minWidth: 900, minHeight: 620)
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Image(systemName: "wand.and.stars")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.orange)
                    .frame(width: 30, height: 30)
                    .mainGlass(
                        in: RoundedRectangle(cornerRadius: 9, style: .continuous),
                        tint: .orange,
                        interactive: false,
                        reduceTransparency: reduceTransparency
                    )

                Text("Teleprompter")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
            }
            .padding(.bottom, 12)

            ForEach(WorkspaceSection.allCases) { item in
                Button {
                    withAnimation(.spring(response: 0.34, dampingFraction: 0.78)) {
                        section = item
                    }
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: item.symbol)
                            .frame(width: 20)
                        Text(item.title)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                        Spacer(minLength: 0)
                    }
                    .foregroundStyle(section == item ? Color.black : Color.primary)
                    .padding(.horizontal, 12)
                    .frame(height: 38)
                    .mainGlass(
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous),
                        tint: section == item ? .orange : nil,
                        interactive: true,
                        reduceTransparency: reduceTransparency
                    )
                }
                .buttonStyle(MainButtonStyle())
            }

            Spacer(minLength: 0)

            VStack(alignment: .leading, spacing: 5) {
                Text("LOCAL LIBRARY")
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)
                Text("Offline by default")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 12)
        }
        .padding(18)
    }
}

private struct FixedCueView<Bridge: NativeRuntimeBridge>: View {
    let bridge: Bridge
    @Binding var pendingInsertion: String
    @State private var mode: MainComposerMode = .create
    @State private var prompt = ""
    @State private var ratio = "4:5"
    @State private var resolution = "2K"
    @State private var activeSheet: MainCueSheet?
    @State private var selections: [MainParameter: String] = [:]
    @State private var opticsSelections: [String: String] = [
        "camera": "Modern",
        "lens": "Natural",
        "aperture": "Auto"
    ]
    @State private var references: [MainReference] = []
    @State private var editGroups: Set<MainParameter> = []
    @State private var previewVisible = false
    @State private var applied = false
    @State private var editPending = false
    @State private var previewText = ""
    @State private var leftBlockHeight: CGFloat = 0
    @Namespace private var modePuck
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            header

            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 14) {
                    parameterRow
                    promptBar

                    if previewVisible {
                        preview
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    GeometryReader { proxy in
                        Color.clear.preference(key: MainLeftBlockHeightKey.self, value: proxy.size.height)
                    }
                )

                actionColumn
                    .frame(width: 150, height: max(leftBlockHeight, 170))
            }
        }
        .padding(26)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .sheet(item: $activeSheet) { sheet in
            FixedCueSheet(
                parameter: sheet.parameter,
                selection: Binding(
                    get: { selections[sheet.parameter] },
                    set: { selections[sheet.parameter] = $0 }
                ),
                opticsSelections: $opticsSelections,
                mode: mode,
                editGroups: $editGroups
            )
            .frame(minWidth: 720, minHeight: 510)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.78), value: previewVisible)
        .onPreferenceChange(MainLeftBlockHeightKey.self) { height in
            leftBlockHeight = height
        }
        .onChange(of: mode) { _, _ in
            editGroups.removeAll()
            editPending = false
        }
        .onChange(of: pendingInsertion) { _, newValue in
            guard !newValue.isEmpty else { return }
            insertPromptText(newValue)
            pendingInsertion = ""
        }
        .onAppear {
            if previewText.isEmpty { previewText = bridge.preview().text }
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Prompt studio")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                Text("Compose, curate, and reuse visual direction")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)

            HStack(spacing: 3) {
                ForEach(MainComposerMode.allCases) { option in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.78)) {
                            mode = option
                        }
                    } label: {
                        ZStack {
                            if mode == option {
                                Color.clear
                                    .mainGlass(
                                        in: Capsule(),
                                        tint: .orange,
                                        interactive: true,
                                        reduceTransparency: reduceTransparency
                                    )
                                    .matchedGeometryEffect(id: "main-mode-puck", in: modePuck)
                            }
                            Text(option.title)
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                                .foregroundStyle(mode == option ? Color.black : Color.primary)
                        }
                        .frame(width: 76, height: 30)
                    }
                    .buttonStyle(MainButtonStyle())
                    .focusEffectDisabled()
                    .accessibilityAddTraits(mode == option ? .isSelected : [])
                }
            }
            .padding(3)
            .mainGlass(
                in: Capsule(),
                interactive: false,
                reduceTransparency: reduceTransparency
            )
            .frame(width: 166, height: 38)
            .accessibilityIdentifier("main-mode-switch")
        }
    }

    private var parameterRow: some View {
        HStack(spacing: 12) {
            ForEach(MainParameter.allCases) { parameter in
                let editSelected = mode == .edit && editGroups.contains(parameter)
                Button {
                    activeSheet = MainCueSheet(rawValue: parameter.rawValue)
                } label: {
                    HStack(spacing: 10) {
                        mainAsset(named: parameter.assetName)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 42, height: 42)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(parameter.title)
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                            Text(selections[parameter] ?? "Choose")
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }

                        Spacer(minLength: 0)
                        if editSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.orange)
                                .accessibilityHidden(true)
                        }
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, 12)
                    .frame(maxWidth: .infinity, minHeight: 70)
                    .mainGlass(
                        in: RoundedRectangle(cornerRadius: 16, style: .continuous),
                        tint: selections[parameter] == nil && !editSelected ? nil : .orange.opacity(0.32),
                        interactive: true,
                        reduceTransparency: reduceTransparency
                    )
                }
                .buttonStyle(MainButtonStyle())
                .accessibilityIdentifier("main-group-\(parameter.rawValue)")
            }
        }
    }

    private var promptBar: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField("Describe the subject, action, and scene", text: $prompt, axis: .vertical)
                .textFieldStyle(.plain)
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .lineLimit(1...8)
                .fixedSize(horizontal: false, vertical: true)
                .frame(minHeight: 86, alignment: .topLeading)
                .accessibilityIdentifier("main-prompt")

            HStack(spacing: 7) {
                Button(action: addReference) {
                    Image(systemName: "photo.badge.plus")
                        .frame(width: 36, height: 32)
                }
                .buttonStyle(MainChipButtonStyle())
                .help("Add Reference")

                mainMenuChip(value: ratio, symbol: "aspectratio", options: ["1:1", "4:5", "16:9"]) { ratio = $0 }
                mainMenuChip(value: resolution, symbol: "4k.tv", options: ["1K", "2K", "4K"]) { resolution = $0 }

                if !references.isEmpty {
                    Text(references.map { "@Image \($0.slot.imageNumber)" }.joined(separator: " "))
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundStyle(.orange)
                        .lineLimit(1)
                }

                Spacer(minLength: 0)

                commandMenu
                referenceMenu
            }
        }
        .padding(14)
        .mainGlass(
            in: RoundedRectangle(cornerRadius: 18, style: .continuous),
            interactive: true,
            reduceTransparency: reduceTransparency
        )
    }

    private var commandMenu: some View {
        Menu {
            Button("Open Optics") { activeSheet = .optics }
            Button("Open Stage") { activeSheet = .stage }
            Button("Open Finish") { activeSheet = .finish }
            Divider()
            ForEach(TokenDictionarySeed.records.prefix(6)) { token in
                Button(token.shorthand) { insertToken(token) }
            }
        } label: {
            Text("/")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .frame(width: 32, height: 32)
                .mainGlass(
                    in: RoundedRectangle(cornerRadius: 9, style: .continuous),
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
        }
        .menuStyle(.borderlessButton)
        .help("Commands")
    }

    private var referenceMenu: some View {
        Menu {
            if references.isEmpty {
                Text("No references")
            } else {
                ForEach(references) { reference in
                    Button("@Image \(reference.slot.imageNumber)") {
                        insertPromptText(reference.slot.mention.triggerText)
                    }
                }
            }
            Divider()
            Button("Add Reference…") { addReference() }
        } label: {
            Text("@")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(references.isEmpty ? Color.primary : Color.orange)
                .frame(width: 32, height: 32)
                .mainGlass(
                    in: RoundedRectangle(cornerRadius: 9, style: .continuous),
                    tint: references.isEmpty ? nil : .orange.opacity(0.32),
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
        }
        .menuStyle(.borderlessButton)
        .help("References")
    }

    private var actionColumn: some View {
        VStack(spacing: 10) {
            Button {
                apply()
            } label: {
                VStack(spacing: 7) {
                    Image(systemName: editPending ? "clock" : applied ? "checkmark" : "arrow.up.forward")
                        .font(.system(size: 27, weight: .bold))
                    Text(editPending ? "Pending" : applied ? "Applied" : "Apply")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                }
                .foregroundStyle(Color.black)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .mainGlass(
                    in: RoundedRectangle(cornerRadius: 18, style: .continuous),
                    tint: .orange,
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
            }
            .buttonStyle(MainButtonStyle())
            .frame(maxHeight: .infinity)
            .accessibilityIdentifier("main-apply")

            Button {
                previewText = bridge.preview().text
                previewVisible.toggle()
            } label: {
                Label("Preview", systemImage: previewVisible ? "eye.slash" : "eye")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .frame(maxWidth: .infinity, minHeight: 36)
                    .mainGlass(
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous),
                        interactive: true,
                        reduceTransparency: reduceTransparency
                    )
            }
            .buttonStyle(MainButtonStyle())
            .accessibilityIdentifier("main-preview")
        }
        .frame(maxHeight: .infinity, alignment: .top)
    }

    private var preview: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("Preview")
                .font(.system(size: 13, weight: .bold, design: .rounded))
            ScrollView {
                Text(previewText)
                    .font(.system(.body, design: .monospaced))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
            }
            .frame(maxHeight: 180)
            .padding(12)
            .mainGlass(
                in: RoundedRectangle(cornerRadius: 14, style: .continuous),
                interactive: false,
                reduceTransparency: reduceTransparency
            )
        }
    }

    @ViewBuilder
    private func mainMenuChip(value: String, symbol: String, options: [String], onSelect: @escaping (String) -> Void) -> some View {
        Menu {
            ForEach(options, id: \.self) { option in
                Button(option) { onSelect(option) }
            }
        } label: {
            Label(value, systemImage: symbol)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .frame(minWidth: 66, minHeight: 32)
                .mainGlass(
                    in: RoundedRectangle(cornerRadius: 10, style: .continuous),
                    interactive: true,
                    reduceTransparency: reduceTransparency
                )
        }
        .menuStyle(.borderlessButton)
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
        let slot = CueReferenceSlot(
            imageNumber: references.count + 1,
            label: name,
            role: .custom,
            aliases: [name]
        )
        references.append(MainReference(slot: slot, localURL: url))
        insertPromptText(slot.mention.triggerText)
    }

    private func apply() {
        guard mode == .create else {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.78)) {
                editPending = true
            }
            return
        }

        _ = bridge.apply(
            NativeCueCommand(
                type: "set-what",
                expectedRevision: bridge.bootstrap().draftRevision,
                value: prompt
            )
        )
        withAnimation(.spring(response: 0.32, dampingFraction: 0.78)) { applied = true }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(0.8))
            withAnimation(.spring(response: 0.32, dampingFraction: 0.78)) { applied = false }
        }
    }

    private func insertToken(_ token: PromptToken) {
        if let definition = TokenDefinition(token: token),
           let insertion = definition.insertion(for: .slash),
           case let .slash(form) = insertion {
            insertPromptText(form.triggerText)
        } else {
            insertPromptText(token.shorthand)
        }
    }

    private func insertPromptText(_ text: String) {
        guard !text.isEmpty else { return }
        if !prompt.isEmpty && !prompt.hasSuffix(" ") { prompt.append(" ") }
        prompt.append(text)
    }
}

private struct FixedCueSheet: View {
    let parameter: MainParameter
    @Binding var selection: String?
    @Binding var opticsSelections: [String: String]
    let mode: MainComposerMode
    @Binding var editGroups: Set<MainParameter>
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    private var options: [String] {
        switch parameter {
        case .optics: ["Natural 50", "35mm Film", "Wide 24", "Deep focus"]
        case .stage: ["Centered", "Portrait frame", "Negative space", "Close crop", "Wide scene", "Overhead", "Low angle", "Detail"]
        case .finish: ["Neutral", "Contrast", "Monochrome", "Warm", "Cool", "Matte", "Bleach", "Neon"]
        }
    }

    private func opticsOptions(for key: String) -> [String] {
        switch key {
        case "camera": ["Modern", "35mm Film"]
        case "lens": ["Natural", "Wide"]
        case "aperture": ["Auto", "Deep focus"]
        default: []
        }
    }

    private var opticsSummary: String {
        ["camera", "lens", "aperture"].compactMap { opticsSelections[$0] }.joined(separator: " · ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(parameter.title)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    Text(mode == .edit ? "Choose edit operations" : "Choose a direction for this prompt")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Button("Done") { dismiss() }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
            }

            if parameter == .optics {
                opticsSlots
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                    ForEach(options, id: \.self) { option in
                        optionCard(option)
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(.regularMaterial)
    }

    private var opticsSlots: some View {
        HStack(spacing: 12) {
            ForEach([("Camera", "camera"), ("Lens", "lens"), ("Aperture", "aperture")], id: \.1) { title, key in
                VStack(alignment: .leading, spacing: 8) {
                    Text(title.uppercased())
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(.secondary)
                    Menu {
                        ForEach(opticsOptions(for: key), id: \.self) { option in
                            Button(option) {
                                var updated = opticsSelections
                                updated[key] = option
                                opticsSelections = updated
                                selection = ["camera", "lens", "aperture"]
                                    .compactMap { updated[$0] }
                                    .joined(separator: " · ")
                                if mode == .edit { editGroups.insert(.optics) }
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: parameter.symbol)
                            Text(opticsSelections[key] ?? "Choose")
                                .lineLimit(1)
                            Spacer(minLength: 0)
                            Image(systemName: "chevron.down")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .padding(12)
                        .mainGlass(
                            in: RoundedRectangle(cornerRadius: 13, style: .continuous),
                            tint: opticsSelections[key] == nil ? nil : .orange.opacity(0.32),
                            interactive: true,
                            reduceTransparency: reduceTransparency
                        )
                    }
                    .menuStyle(.borderlessButton)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func optionCard(_ option: String) -> some View {
        Button {
            selection = option
            if mode == .edit { editGroups.insert(parameter) }
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: parameter.symbol)
                        .font(.system(size: 26, weight: .medium))
                        .frame(maxWidth: .infinity, minHeight: 64)
                        .foregroundStyle(.orange)
                    if selection == option {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.orange)
                    }
                }
                Text(option)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .lineLimit(1)
            }
            .padding(10)
            .mainGlass(
                in: RoundedRectangle(cornerRadius: 15, style: .continuous),
                tint: selection == option ? .orange.opacity(0.32) : nil,
                interactive: true,
                reduceTransparency: reduceTransparency
            )
        }
        .buttonStyle(MainButtonStyle())
    }
}

private struct MainGalleryPane: View {
    @State private var query = ""
    @State private var showingImporter = false
    @State private var customEntries: [String] = []
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    private let curated: [(String, String, [String])] = [
        ("Natural portrait", "Optics", ["camera", "natural", "portrait"]),
        ("Centered product", "Stage", ["stage", "centered", "product"]),
        ("Warm editorial", "Finish", ["finish", "warm", "editorial"]),
        ("Negative space", "Stage", ["stage", "negative-space", "campaign"])
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gallery")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("Curated directions and your own reusable elements")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Button {
                    showingImporter = true
                } label: {
                    Label("Add element", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }

            TextField("Search tags", text: $query)
                .textFieldStyle(.roundedBorder)
                .frame(maxWidth: 320)

            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 190), spacing: 14)], spacing: 14) {
                    ForEach(filteredCurated, id: \.0) { item in
                        galleryCard(title: item.0, family: item.1, tags: item.2, custom: false)
                    }
                    ForEach(customEntries, id: \.self) { item in
                        galleryCard(title: item, family: "Your elements", tags: ["custom", "reference"], custom: true)
                    }
                }
            }
        }
        .padding(26)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .fileImporter(isPresented: $showingImporter, allowedContentTypes: [.image, .movie]) { result in
            if case let .success(url) = result {
                customEntries.append(url.deletingPathExtension().lastPathComponent)
            }
        }
    }

    private var filteredCurated: [(String, String, [String])] {
        guard !query.isEmpty else { return curated }
        return curated.filter { item in
            ([item.0, item.1] + item.2).joined(separator: " ").localizedCaseInsensitiveContains(query)
        }
    }

    private func galleryCard(title: String, family: String, tags: [String], custom: Bool) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(LinearGradient(colors: custom ? [.orange.opacity(0.65), .pink.opacity(0.26)] : [.white.opacity(0.14), .orange.opacity(0.22)], startPoint: .topLeading, endPoint: .bottomTrailing))
                Image(systemName: custom ? "shippingbox" : "sparkles")
                    .font(.system(size: 29, weight: .medium))
                    .foregroundStyle(custom ? Color.orange : Color.white)
            }
            .frame(height: 106)

            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
            Text(family)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)
            HStack(spacing: 5) {
                ForEach(tags, id: \.self) { tag in
                    Text(tag)
                        .font(.system(size: 9, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 4)
                        .background(Color.primary.opacity(0.08), in: Capsule())
                }
            }
        }
        .padding(12)
        .mainGlass(
            in: RoundedRectangle(cornerRadius: 16, style: .continuous),
            interactive: false,
            reduceTransparency: reduceTransparency
        )
    }
}

private struct MainTokenPane: View {
    @StateObject private var model: TokenDictionaryModel
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    init() {
        _model = StateObject(wrappedValue: TokenDictionaryModel())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Token dictionary")
                .font(.system(size: 24, weight: .bold, design: .rounded))
            Text("Stable prompt vocabulary for menus, slash commands, and references")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)

            HStack(spacing: 10) {
                TextField("Search tokens", text: $model.query)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 320)

                Menu {
                    Button("All categories") { model.selectedCategory = nil }
                    Divider()
                    ForEach(model.availableCategories, id: \.self) { category in
                        Button(category.displayName) { model.selectedCategory = category }
                    }
                } label: {
                    Label(model.selectedCategory?.displayName ?? "All categories", systemImage: "line.3.horizontal.decrease.circle")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                }
                .menuStyle(.borderlessButton)

                Text(model.resultSummary)
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.secondary)
            }

            ScrollView {
                LazyVStack(spacing: 9) {
                    ForEach(model.filteredTokens) { token in
                        HStack(spacing: 12) {
                            Image(systemName: token.kind.iconName)
                                .foregroundStyle(.orange)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(token.label)
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                Text(token.expansion)
                                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                            Spacer(minLength: 0)

                            Button {
                                NSPasteboard.general.clearContents()
                                NSPasteboard.general.setString(model.copyText(for: token), forType: .string)
                            } label: {
                                Image(systemName: "doc.on.doc")
                                    .frame(width: 28, height: 28)
                            }
                            .buttonStyle(MainChipButtonStyle())
                            .help("Copy \(token.shorthand)")
                        }
                        .padding(12)
                        .mainGlass(
                            in: RoundedRectangle(cornerRadius: 13, style: .continuous),
                            interactive: false,
                            reduceTransparency: reduceTransparency
                        )
                    }
                }
            }
        }
        .padding(26)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

private struct MainButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.975 : 1)
            .animation(.spring(response: 0.22, dampingFraction: 0.72), value: configuration.isPressed)
    }
}

private struct MainChipButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.primary)
            .mainGlass(
                in: RoundedRectangle(cornerRadius: 10, style: .continuous),
                interactive: true,
                reduceTransparency: reduceTransparency
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}

private extension View {
    @ViewBuilder
    func mainGlass<S: Shape>(
        in shape: S,
        tint: Color? = nil,
        interactive: Bool,
        reduceTransparency: Bool
    ) -> some View {
        if reduceTransparency {
            background(Color(nsColor: .controlBackgroundColor).opacity(0.92), in: shape)
                .overlay(shape.stroke(Color(nsColor: .separatorColor).opacity(0.78), lineWidth: 1))
        } else {
            glassEffect(.regular.tint(tint).interactive(interactive), in: shape)
        }
    }
}

private func mainAsset(named name: String) -> Image {
    guard let path = Bundle.main.path(forResource: name, ofType: "png"),
          let image = NSImage(contentsOfFile: path) else {
        return Image(systemName: "photo")
    }
    return Image(nsImage: image)
}
