import Combine
import Foundation

enum GallerySourceFilter: String, CaseIterable, Identifiable, Sendable {
    case all
    case curated
    case added

    var id: Self { self }

    var displayName: String {
        switch self {
        case .all: "All"
        case .curated: "Curated"
        case .added: "Added"
        }
    }

    var source: GalleryEntrySource? {
        switch self {
        case .all: nil
        case .curated: .curated
        case .added: .userAdded
        }
    }
}

@MainActor
final class GalleryStore: ObservableObject {
    private struct UserState: Codable {
        let schemaVersion: Int
        let tags: [GalleryTag]
        let entries: [GalleryEntry]
    }

    private let defaults: UserDefaults
    private let persistenceKey = "teleprompter.native.gallery.user-state"
    @Published private(set) var catalog: GalleryCatalog
    @Published var query = ""
    @Published var selectedTagIDs: Set<String> = []
    @Published var sourceFilter: GallerySourceFilter = .all
    @Published var kindFilter: GalleryEntryKind?
    @Published var selectedEntryID: String?
    @Published var errorMessage: String?

    init(catalog: GalleryCatalog, defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.catalog = Self.restoreUserState(into: catalog, defaults: defaults)
    }

    var visibleEntries: [GalleryEntry] {
        catalog.entries.filter { entry in
            catalog.matches(
                entry,
                query: query,
                selectedTagIDs: selectedTagIDs,
                source: sourceFilter.source,
                kind: kindFilter
            )
        }
    }

    var selectedEntry: GalleryEntry? {
        catalog.entry(id: selectedEntryID)
    }

    var visibleTags: [GalleryTag] {
        catalog.registry.tags.sorted { lhs, rhs in
            if lhs.scope != rhs.scope { return lhs.scope.rawValue < rhs.scope.rawValue }
            return lhs.label.localizedCaseInsensitiveCompare(rhs.label) == .orderedAscending
        }
    }

    func tagCount(_ tagID: String) -> Int {
        catalog.entries.filter { catalog.tagIDs(for: $0).contains(tagID) }.count
    }

    func toggleTag(_ tagID: String) {
        if selectedTagIDs.contains(tagID) {
            selectedTagIDs.remove(tagID)
        } else {
            selectedTagIDs.insert(tagID)
        }
    }

    func clearFilters() {
        query = ""
        selectedTagIDs.removeAll()
        sourceFilter = .all
        kindFilter = nil
    }

    @discardableResult
    func addUserEntry(
        title: String,
        summary: String,
        kind: GalleryEntryKind,
        media: GalleryMediaReference,
        tagLabels: [String],
        elements: [GalleryElement] = []
    ) -> GalleryEntry? {
        do {
            let entry = try catalog.addUserEntry(
                title: title,
                summary: summary,
                kind: kind,
                media: media,
                tagLabels: tagLabels,
                elements: elements
            )
            selectedEntryID = entry.id
            errorMessage = nil
            persistUserState()
            return entry
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func addElement(_ element: GalleryElement, to entryID: String) {
        do {
            try catalog.addElement(element, to: entryID)
            errorMessage = nil
            persistUserState()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func persistUserState() {
        let bundledTagIDs = Set(GalleryFixtures.catalog.registry.tags.map(\.id))
        let userTags = catalog.registry.tags.filter { !bundledTagIDs.contains($0.id) }
        let userEntries = catalog.entries.filter { $0.source == .userAdded }
        guard let data = try? JSONEncoder().encode(
            UserState(schemaVersion: 1, tags: userTags, entries: userEntries)
        ) else { return }
        defaults.set(data, forKey: persistenceKey)
    }

    private static func restoreUserState(into base: GalleryCatalog, defaults: UserDefaults) -> GalleryCatalog {
        guard let data = defaults.data(forKey: "teleprompter.native.gallery.user-state"),
              let state = try? JSONDecoder().decode(UserState.self, from: data),
              state.schemaVersion == 1 else {
            return base
        }

        let existingTagIDs = Set(base.registry.tags.map(\.id))
        let userTags = state.tags.filter { !existingTagIDs.contains($0.id) && $0.scope == .user }
        let existingEntryIDs = Set(base.entries.map(\.id))
        let userEntries = state.entries.filter { $0.source == .userAdded && !existingEntryIDs.contains($0.id) }

        guard !userTags.isEmpty || !userEntries.isEmpty else { return base }
        return (try? GalleryCatalog(
            tags: base.registry.tags + userTags,
            entries: base.entries + userEntries
        )) ?? base
    }
}
