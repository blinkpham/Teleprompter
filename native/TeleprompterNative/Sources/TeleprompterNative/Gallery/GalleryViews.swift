import AppKit
import SwiftUI

@MainActor
struct GalleryView: View {
    private let accent = Color.orange
    @StateObject private var store: GalleryStore
    @State private var showingAddSheet = false
    @State private var addKind: GalleryEntryKind = .brandAsset
    @State private var columnVisibility: NavigationSplitViewVisibility = .all

    init(catalog: GalleryCatalog = GalleryFixtures.catalog) {
        _store = StateObject(wrappedValue: GalleryStore(catalog: catalog))
    }

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            filterRail
        } content: {
            galleryContent
        } detail: {
            inspector
        }
        .navigationSplitViewStyle(.balanced)
        .preferredColorScheme(.dark)
        .sheet(isPresented: $showingAddSheet) {
            GalleryAddSheet(store: store, initialKind: addKind)
        }
    }

    private var filterRail: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                Text("Browse")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                Spacer(minLength: 0)
                if !store.selectedTagIDs.isEmpty || store.sourceFilter != .all || store.kindFilter != nil {
                    Button("Clear") { store.clearFilters() }
                        .buttonStyle(.link)
                        .font(.system(size: 11, weight: .medium))
                }
            }

            Picker("Source", selection: $store.sourceFilter) {
                ForEach(GallerySourceFilter.allCases) { filter in
                    Text(filter.displayName).tag(filter)
                }
            }
            .pickerStyle(.menu)

            Divider()

            Text("Tags")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 5) {
                    ForEach(store.visibleTags) { tag in
                        GalleryTagRow(
                            tag: tag,
                            count: store.tagCount(tag.id),
                            selected: store.selectedTagIDs.contains(tag.id),
                            accent: accent
                        ) {
                            withAnimation(galleryAnimation) { store.toggleTag(tag.id) }
                        }
                    }
                }
            }

            Spacer(minLength: 0)

            VStack(alignment: .leading, spacing: 5) {
                Circle()
                    .fill(accent)
                    .frame(width: 6, height: 6)
                Text("Library stays local")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                Text("Curated entries and your added assets share one searchable tag system.")
                    .font(.system(size: 10, weight: .regular))
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.top, 8)
        }
        .padding(16)
        .frame(minWidth: 198, idealWidth: 220, maxWidth: 246, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.black.opacity(0.16))
    }

    private var galleryContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            GalleryHeader(
                query: $store.query,
                visibleCount: store.visibleEntries.count,
                totalCount: store.catalog.entries.count,
                accent: accent,
                onAdd: { kind in
                    addKind = kind
                    showingAddSheet = true
                }
            )

            Divider()
                .opacity(0.55)

            if store.visibleEntries.isEmpty {
                GalleryEmptyState(query: store.query, onClear: store.clearFilters)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVGrid(
                        columns: [GridItem(.adaptive(minimum: 225, maximum: 340), spacing: 14)],
                        spacing: 14
                    ) {
                        ForEach(store.visibleEntries) { entry in
                            GalleryEntryCard(
                                entry: entry,
                                tags: store.catalog.tags(for: entry),
                                selected: store.selectedEntryID == entry.id,
                                accent: accent
                            ) {
                                withAnimation(galleryAnimation) {
                                    store.selectedEntryID = entry.id
                                }
                            }
                            .contextMenu {
                                Button("Inspect") { store.selectedEntryID = entry.id }
                            }
                        }
                    }
                    .padding(20)
                }
            }
        }
        .background(Color(nsColor: .windowBackgroundColor).opacity(0.56))
    }

    @ViewBuilder
    private var inspector: some View {
        if let entry = store.selectedEntry {
            GalleryInspector(entry: entry, tags: store.catalog.tags(for: entry), accent: accent) {
                withAnimation(galleryAnimation) { store.selectedEntryID = nil }
            }
        } else {
            ContentUnavailableView(
                "Choose an entry",
                systemImage: "square.grid.2x2",
                description: Text("Inspect a curated direction or an added brand asset/product.")
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var galleryAnimation: Animation {
        .spring(response: 0.28, dampingFraction: 0.82, blendDuration: 0.08)
    }
}

@MainActor
private struct GalleryHeader: View {
    @Binding var query: String
    let visibleCount: Int
    let totalCount: Int
    let accent: Color
    let onAdd: (GalleryEntryKind) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gallery")
                        .font(.system(size: 25, weight: .semibold, design: .rounded))
                    Text("Directions, references, and working assets")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 0)

                Text("\(visibleCount) / \(totalCount)")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.secondary)

                Menu {
                    Button("Brand asset") { onAdd(.brandAsset) }
                    Button("Product") { onAdd(.product) }
                    Button("Direction") { onAdd(.direction) }
                } label: {
                    Label("Add", systemImage: "plus")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color.black)
                        .padding(.horizontal, 12)
                        .frame(height: 32)
                        .galleryGlass(in: Capsule(), tint: accent, interactive: true)
                }
                .menuStyle(.borderlessButton)
                .accessibilityLabel("Add gallery entry")
            }

            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Search titles, tags, or elements", text: $query)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .accessibilityLabel("Search gallery")

                if !query.isEmpty {
                    Button {
                        query = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Clear gallery search")
                }
            }
            .padding(.horizontal, 12)
            .frame(height: 38)
            .galleryGlass(in: RoundedRectangle(cornerRadius: 12, style: .continuous), interactive: true)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 18)
    }
}

@MainActor
private struct GalleryTagRow: View {
    let tag: GalleryTag
    let count: Int
    let selected: Bool
    let accent: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Circle()
                    .fill(selected ? accent : Color.secondary.opacity(0.48))
                    .frame(width: 5, height: 5)
                Text(tag.label)
                    .font(.system(size: 12, weight: selected ? .semibold : .regular, design: .rounded))
                    .foregroundStyle(selected ? .primary : .secondary)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Text("\(count)")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 9)
            .frame(height: 30)
            .galleryGlass(
                in: RoundedRectangle(cornerRadius: 9, style: .continuous),
                tint: selected ? accent.opacity(0.22) : nil,
                interactive: true
            )
        }
        .buttonStyle(.plain)
        .help("Filter by \(tag.label)")
        .accessibilityLabel("Filter by \(tag.label), \(count) entries")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

@MainActor
private struct GalleryEntryCard: View {
    let entry: GalleryEntry
    let tags: [GalleryTag]
    let selected: Bool
    let accent: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                ZStack(alignment: .topLeading) {
                    GalleryMediaView(reference: entry.media)
                        .frame(maxWidth: .infinity)
                        .frame(height: 148)
                        .clipped()

                    HStack(spacing: 6) {
                        Label(entry.kind.displayName, systemImage: entry.kind.systemImage)
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .padding(.horizontal, 8)
                            .frame(height: 24)
                            .galleryGlass(in: Capsule(), tint: selected ? accent.opacity(0.24) : nil, interactive: false)

                        Spacer(minLength: 0)

                        if entry.source == .userAdded {
                            Text("ADDED")
                                .font(.system(size: 9, weight: .bold, design: .monospaced))
                                .foregroundStyle(accent)
                        }
                    }
                    .padding(10)
                }
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))

                VStack(alignment: .leading, spacing: 5) {
                    Text(entry.title)
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    Text(entry.summary)
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 5) {
                        ForEach(tags.prefix(3)) { tag in
                            Text(tag.label)
                                .font(.system(size: 9, weight: .medium, design: .rounded))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        if tags.count > 3 {
                            Text("+\(tags.count - 3)")
                                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                                .foregroundStyle(.tertiary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .galleryGlass(
                in: RoundedRectangle(cornerRadius: 16, style: .continuous),
                tint: selected ? accent.opacity(0.14) : nil,
                interactive: true
            )
            .overlay {
                if selected {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(accent.opacity(0.8), lineWidth: 1)
                }
            }
        }
        .buttonStyle(GalleryPressStyle())
        .accessibilityLabel("\(entry.title), \(entry.kind.displayName)")
        .accessibilityHint("Open gallery details")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

@MainActor
private struct GalleryMediaView: View {
    let reference: GalleryMediaReference

    var body: some View {
        Group {
            switch reference.storage {
            case .symbol:
                symbol
            case .bundledAsset:
                bundledAsset
            case .localFile:
                localFile
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.26))
    }

    private var symbol: some View {
        Image(systemName: reference.value)
            .font(.system(size: 42, weight: .light))
            .foregroundStyle(Color.orange.opacity(0.92))
            .symbolRenderingMode(.hierarchical)
    }

    private var bundledAsset: some View {
        let resourceURL = Bundle.module.url(forResource: reference.value, withExtension: "png")
        if let resourceURL, let image = NSImage(contentsOf: resourceURL) {
            return AnyView(
                Image(nsImage: image)
                    .resizable()
                    .scaledToFill()
                    .opacity(0.94)
            )
        }
        return AnyView(symbol)
    }

    private var localFile: some View {
        if let image = NSImage(contentsOfFile: reference.value) {
            return AnyView(
                Image(nsImage: image)
                    .resizable()
                    .scaledToFill()
            )
        }
        return AnyView(symbol)
    }
}

@MainActor
private struct GalleryInspector: View {
    let entry: GalleryEntry
    let tags: [GalleryTag]
    let accent: Color
    let close: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Details")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                Spacer(minLength: 0)
                Button(action: close) {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .frame(width: 28, height: 28)
                        .galleryGlass(in: Circle(), interactive: true)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Close details")
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    GalleryMediaView(reference: entry.media)
                        .frame(height: 160)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                    VStack(alignment: .leading, spacing: 6) {
                        Text(entry.title)
                            .font(.system(size: 21, weight: .semibold, design: .rounded))
                        HStack(spacing: 8) {
                            Label(entry.kind.displayName, systemImage: entry.kind.systemImage)
                            Text("·")
                            Text(entry.source.displayName)
                        }
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                    }

                    Text(entry.summary)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Tags")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                        FlowTagLayout(tags: tags, accent: accent)
                    }

                    if !entry.elements.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Elements")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)

                            ForEach(entry.elements) { element in
                                HStack(alignment: .top, spacing: 10) {
                                    Image(systemName: element.kind.systemImage)
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundStyle(accent)
                                        .frame(width: 24, height: 24)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(element.label)
                                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                                        Text(element.detail)
                                            .font(.system(size: 11, weight: .regular))
                                            .foregroundStyle(.secondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    Spacer(minLength: 0)
                                }
                                .padding(10)
                                .galleryGlass(in: RoundedRectangle(cornerRadius: 11, style: .continuous), interactive: false)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 18)
            }
        }
        .frame(minWidth: 280, idealWidth: 315, maxWidth: 360, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.black.opacity(0.14))
    }
}

@MainActor
private struct FlowTagLayout: View {
    let tags: [GalleryTag]
    let accent: Color

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), alignment: .leading)], alignment: .leading, spacing: 6) {
            ForEach(tags) { tag in
                Text(tag.label)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 8)
                    .frame(minHeight: 25)
                    .galleryGlass(in: Capsule(), tint: accent.opacity(0.1), interactive: false)
            }
        }
    }
}

@MainActor
private struct GalleryEmptyState: View {
    let query: String
    let onClear: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "line.3.horizontal.decrease.circle")
                .font(.system(size: 25, weight: .light))
                .foregroundStyle(Color.orange)
            Text(query.isEmpty ? "No entries yet" : "No matches")
                .font(.system(size: 16, weight: .semibold, design: .rounded))
            Text(query.isEmpty ? "Add a brand asset, product, or direction to start a local collection." : "Try a shorter search or clear the active filters.")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 280)
            if !query.isEmpty {
                Button("Clear filters", action: onClear)
                    .buttonStyle(.bordered)
                    .tint(.orange)
            }
        }
        .padding(30)
    }
}

@MainActor
private struct GalleryAddSheet: View {
    @ObservedObject var store: GalleryStore
    @Environment(\.dismiss) private var dismiss
    @State private var kind: GalleryEntryKind
    @State private var title = ""
    @State private var summary = ""
    @State private var tags = ""
    @State private var media = GalleryMediaReference.symbol("photo")

    init(store: GalleryStore, initialKind: GalleryEntryKind) {
        self.store = store
        _kind = State(initialValue: initialKind)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Add to gallery")
                        .font(.system(size: 19, weight: .semibold, design: .rounded))
                    Text("Keep the title and tags human-readable; the library will manage canonical IDs.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
            .padding(20)

            Divider()

            Form {
                Picker("Type", selection: $kind) {
                    ForEach([GalleryEntryKind.brandAsset, .product, .direction]) { option in
                        Label(option.displayName, systemImage: option.systemImage).tag(option)
                    }
                }

                TextField("Name", text: $title)
                TextField("Short description", text: $summary, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Tags", text: $tags, prompt: Text("brand, product, reusable"))

                HStack {
                    Label(media.storage == .localFile ? "Image selected" : "Symbol fallback", systemImage: media.storage == .localFile ? "checkmark.circle" : "photo")
                        .foregroundStyle(media.storage == .localFile ? Color.orange : .secondary)
                    Spacer(minLength: 0)
                    Button("Choose image…", action: chooseImage)
                }
            }
            .formStyle(.grouped)
            .padding(.horizontal, 10)

            if let errorMessage = store.errorMessage {
                Text(errorMessage)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.red)
                    .padding(.horizontal, 22)
            }

            Divider()

            HStack {
                Spacer(minLength: 0)
                Button("Cancel") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Button("Add") { addEntry() }
                    .keyboardShortcut(.defaultAction)
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(16)
        }
        .frame(width: 480, height: 390)
        .preferredColorScheme(.dark)
    }

    private func chooseImage() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.prompt = "Choose Image"

        guard panel.runModal() == .OK, let url = panel.url else { return }
        media = .localFile(path: url.path)
    }

    private func addEntry() {
        let elementKind: GalleryElementKind = switch kind {
        case .brandAsset: .brandAsset
        case .product: .product
        default: .direction
        }
        let element = GalleryElement(
            label: title,
            detail: summary.isEmpty ? "User-added gallery element." : summary,
            kind: elementKind,
            media: media
        )
        let tagLabels = tags
            .split(separator: ",")
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        if store.addUserEntry(title: title, summary: summary, kind: kind, media: media, tagLabels: tagLabels, elements: [element]) != nil {
            dismiss()
        }
    }
}

private struct GalleryPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.985 : 1)
            .animation(
                reduceMotion ? .easeOut(duration: 0.08) : .spring(response: 0.2, dampingFraction: 0.76),
                value: configuration.isPressed
            )
    }
}

private struct GalleryGlassModifier<S: Shape>: ViewModifier {
    let shape: S
    let tint: Color?
    let interactive: Bool
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    @ViewBuilder
    func body(content: Content) -> some View {
        if reduceTransparency {
            content
                .background(Color(nsColor: .controlBackgroundColor).opacity(0.94), in: shape)
                .overlay(shape.stroke(Color(nsColor: .separatorColor).opacity(0.78), lineWidth: 1))
        } else {
            content
                .glassEffect(.regular.tint(tint).interactive(interactive), in: shape)
        }
    }
}

private extension View {
    func galleryGlass<S: Shape>(
        in shape: S,
        tint: Color? = nil,
        interactive: Bool
    ) -> some View {
        modifier(GalleryGlassModifier(shape: shape, tint: tint, interactive: interactive))
    }
}
