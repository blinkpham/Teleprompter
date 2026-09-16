import Foundation

private func galleryUnique<T: Hashable>(_ values: [T]) -> [T] {
    var seen = Set<T>()
    return values.filter { seen.insert($0).inserted }
}

enum GalleryEntryKind: String, CaseIterable, Codable, Hashable, Identifiable, Sendable {
    case direction
    case brandAsset
    case product
    case collection

    var id: Self { self }

    var displayName: String {
        switch self {
        case .direction: "Direction"
        case .brandAsset: "Brand asset"
        case .product: "Product"
        case .collection: "Collection"
        }
    }

    var systemImage: String {
        switch self {
        case .direction: "sparkles"
        case .brandAsset: "seal"
        case .product: "shippingbox"
        case .collection: "square.stack.3d.up"
        }
    }
}

enum GalleryEntrySource: String, Codable, Hashable, Sendable {
    case curated
    case userAdded

    var displayName: String {
        switch self {
        case .curated: "Curated"
        case .userAdded: "Added"
        }
    }
}

enum GalleryElementKind: String, CaseIterable, Codable, Hashable, Sendable {
    case direction
    case brandAsset
    case product
    case material
    case reference

    var systemImage: String {
        switch self {
        case .direction: "wand.and.stars"
        case .brandAsset: "seal"
        case .product: "shippingbox"
        case .material: "square.3.layers.3d"
        case .reference: "photo"
        }
    }
}

enum GalleryTagScope: String, CaseIterable, Codable, Hashable, Sendable {
    case family
    case medium
    case subject
    case material
    case workflow
    case user

    var label: String {
        switch self {
        case .family: "Family"
        case .medium: "Medium"
        case .subject: "Subject"
        case .material: "Material"
        case .workflow: "Workflow"
        case .user: "User"
        }
    }
}

struct GalleryTag: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let label: String
    let scope: GalleryTagScope
    let aliases: [String]

    init(id: String? = nil, label: String, scope: GalleryTagScope, aliases: [String] = []) {
        let cleanedLabel = label.trimmingCharacters(in: .whitespacesAndNewlines)
        self.id = id ?? Self.makeID(label: cleanedLabel, scope: scope)
        self.label = cleanedLabel
        self.scope = scope
        self.aliases = aliases
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    static func makeID(label: String, scope: GalleryTagScope) -> String {
        "\(scope.rawValue).\(slug(label))"
    }

    static func slug(_ value: String) -> String {
        let folded = value
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        let pieces = folded
            .split { character in
                !(character.isLetter || character.isNumber)
            }
            .map(String.init)
        return pieces.isEmpty ? "untitled" : pieces.joined(separator: "-")
    }

    static func normalize(_ value: String) -> String {
        value
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
            .split { $0.isWhitespace || $0 == "-" || $0 == "_" }
            .joined(separator: " ")
    }
}

struct GalleryMediaReference: Codable, Hashable, Sendable {
    enum Storage: String, Codable, Hashable, Sendable {
        case symbol
        case bundledAsset
        case localFile
    }

    let storage: Storage
    let value: String

    static func symbol(_ name: String) -> Self {
        Self(storage: .symbol, value: name)
    }

    static func bundledAsset(_ name: String) -> Self {
        Self(storage: .bundledAsset, value: name)
    }

    static func localFile(path: String) -> Self {
        Self(storage: .localFile, value: path)
    }
}

struct GalleryElement: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let label: String
    let detail: String
    let kind: GalleryElementKind
    let media: GalleryMediaReference
    let tagIDs: [String]

    init(
        id: String = "user.element.\(UUID().uuidString.lowercased())",
        label: String,
        detail: String,
        kind: GalleryElementKind,
        media: GalleryMediaReference,
        tagIDs: [String] = []
    ) {
        self.id = id
        self.label = label.trimmingCharacters(in: .whitespacesAndNewlines)
        self.detail = detail.trimmingCharacters(in: .whitespacesAndNewlines)
        self.kind = kind
        self.media = media
        self.tagIDs = galleryUnique(tagIDs)
    }
}

struct GalleryEntry: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let title: String
    let summary: String
    let kind: GalleryEntryKind
    let source: GalleryEntrySource
    let media: GalleryMediaReference
    let tagIDs: [String]
    let elements: [GalleryElement]
    let createdAt: Date?

    init(
        id: String,
        title: String,
        summary: String,
        kind: GalleryEntryKind,
        source: GalleryEntrySource,
        media: GalleryMediaReference,
        tagIDs: [String] = [],
        elements: [GalleryElement] = [],
        createdAt: Date? = nil
    ) {
        self.id = id
        self.title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        self.summary = summary.trimmingCharacters(in: .whitespacesAndNewlines)
        self.kind = kind
        self.source = source
        self.media = media
        self.tagIDs = galleryUnique(tagIDs)
        self.elements = elements
        self.createdAt = createdAt
    }
}

enum GalleryCatalogError: Error, Equatable, LocalizedError, Sendable {
    case emptyTagID
    case duplicateTagID(String)
    case duplicateTagAlias(String)
    case unknownTag(entryID: String, tagID: String)
    case duplicateEntryID(String)
    case duplicateElementID(String)
    case emptyEntryTitle
    case userEntryRequired
    case entryNotFound(String)

    var errorDescription: String? {
        switch self {
        case .emptyTagID: "A gallery tag must have an ID."
        case let .duplicateTagID(id): "The gallery tag \(id) is defined more than once."
        case let .duplicateTagAlias(alias): "The gallery tag alias \(alias) is ambiguous."
        case let .unknownTag(entryID, tagID): "Entry \(entryID) refers to unknown tag \(tagID)."
        case let .duplicateEntryID(id): "The gallery entry \(id) is defined more than once."
        case let .duplicateElementID(id): "The gallery element \(id) is defined more than once."
        case .emptyEntryTitle: "Give the gallery entry a name before adding it."
        case .userEntryRequired: "Only user-added entries can be created from the gallery."
        case let .entryNotFound(id): "The gallery entry \(id) no longer exists."
        }
    }
}

struct GalleryTagRegistry: Codable, Hashable, Sendable {
    private(set) var tags: [GalleryTag]

    init(tags: [GalleryTag]) throws {
        var seenIDs = Set<String>()
        var seenNames = Set<String>()

        for tag in tags {
            let normalizedID = GalleryTag.normalize(tag.id)
            guard !normalizedID.isEmpty else { throw GalleryCatalogError.emptyTagID }
            guard seenIDs.insert(normalizedID).inserted else {
                throw GalleryCatalogError.duplicateTagID(tag.id)
            }

            let names = [tag.label] + tag.aliases
            for name in names {
                let normalizedName = GalleryTag.normalize(name)
                guard !normalizedName.isEmpty else { continue }
                guard seenNames.insert(normalizedName).inserted else {
                    throw GalleryCatalogError.duplicateTagAlias(name)
                }
            }
        }

        self.tags = tags
    }

    func tag(id: String) -> GalleryTag? {
        let normalized = GalleryTag.normalize(id)
        return tags.first { GalleryTag.normalize($0.id) == normalized }
    }

    func resolve(_ rawValue: String) -> String? {
        let normalized = GalleryTag.normalize(rawValue)
        guard !normalized.isEmpty else { return nil }
        return tags.first { tag in
            GalleryTag.normalize(tag.id) == normalized
                || GalleryTag.normalize(tag.label) == normalized
                || tag.aliases.contains(where: { GalleryTag.normalize($0) == normalized })
        }?.id
    }

    func label(for id: String) -> String {
        tag(id: id)?.label ?? id
    }

    mutating func ensureUserTag(label: String) -> String {
        if let existing = resolve(label) { return existing }

        let baseID = GalleryTag.makeID(label: label, scope: .user)
        var candidate = baseID
        var suffix = 2
        while tag(id: candidate) != nil {
            candidate = "\(baseID)-\(suffix)"
            suffix += 1
        }

        tags.append(GalleryTag(id: candidate, label: label, scope: .user))
        return candidate
    }
}

struct GalleryCatalog: Codable, Hashable, Sendable {
    private(set) var registry: GalleryTagRegistry
    private(set) var entries: [GalleryEntry]

    init(tags: [GalleryTag], entries: [GalleryEntry]) throws {
        let registry = try GalleryTagRegistry(tags: tags)
        try Self.validate(entries: entries, registry: registry)
        self.registry = registry
        self.entries = entries
    }

    init(registry: GalleryTagRegistry, entries: [GalleryEntry]) throws {
        try Self.validate(entries: entries, registry: registry)
        self.registry = registry
        self.entries = entries
    }

    func entry(id: String?) -> GalleryEntry? {
        guard let id else { return nil }
        return entries.first { $0.id == id }
    }

    func tagIDs(for entry: GalleryEntry) -> [String] {
        Array(Set(entry.tagIDs + entry.elements.flatMap(\.tagIDs)))
    }

    func tags(for entry: GalleryEntry) -> [GalleryTag] {
        let ids = Set(tagIDs(for: entry))
        return registry.tags.filter { ids.contains($0.id) }
    }

    func matches(
        _ entry: GalleryEntry,
        query: String,
        selectedTagIDs: Set<String>,
        source: GalleryEntrySource?,
        kind: GalleryEntryKind?
    ) -> Bool {
        if let source, entry.source != source { return false }
        if let kind, entry.kind != kind { return false }

        let entryTags = Set(tagIDs(for: entry))
        guard selectedTagIDs.isSubset(of: entryTags) else { return false }

        let tokens = GalleryTag.normalize(query)
            .split(separator: " ")
            .map(String.init)
        guard !tokens.isEmpty else { return true }

        let searchableText = ([entry.title, entry.summary, entry.kind.displayName, entry.source.displayName]
            + tags(for: entry).flatMap { [$0.label] + $0.aliases }
            + entry.elements.flatMap { [$0.label, $0.detail] })
            .map(GalleryTag.normalize)
            .joined(separator: " ")

        return tokens.allSatisfy { searchableText.contains($0) }
    }

    @discardableResult
    mutating func addUserEntry(
        title: String,
        summary: String,
        kind: GalleryEntryKind,
        media: GalleryMediaReference,
        tagLabels: [String],
        elements: [GalleryElement] = []
    ) throws -> GalleryEntry {
        guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw GalleryCatalogError.emptyEntryTitle
        }

        let tagIDs = tagLabels
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .map { registry.ensureUserTag(label: $0) }

        let entry = GalleryEntry(
            id: "user.entry.\(UUID().uuidString.lowercased())",
            title: title,
            summary: summary,
            kind: kind,
            source: .userAdded,
            media: media,
            tagIDs: tagIDs,
            elements: elements,
            createdAt: Date()
        )
        try append(entry)
        return entry
    }

    mutating func append(_ entry: GalleryEntry) throws {
        guard entry.source == .userAdded else { throw GalleryCatalogError.userEntryRequired }
        try Self.validate(entries: entries + [entry], registry: registry)
        entries.append(entry)
    }

    mutating func addElement(_ element: GalleryElement, to entryID: String) throws {
        guard let index = entries.firstIndex(where: { $0.id == entryID }) else {
            throw GalleryCatalogError.entryNotFound(entryID)
        }

        let existingIDs = Set(entries.flatMap(\.elements).map(\.id))
        guard !existingIDs.contains(element.id) else {
            throw GalleryCatalogError.duplicateElementID(element.id)
        }

        for tagID in element.tagIDs {
            guard registry.tag(id: tagID) != nil else {
                throw GalleryCatalogError.unknownTag(entryID: entryID, tagID: tagID)
            }
        }

        let entry = entries[index]
        entries[index] = GalleryEntry(
            id: entry.id,
            title: entry.title,
            summary: entry.summary,
            kind: entry.kind,
            source: entry.source,
            media: entry.media,
            tagIDs: entry.tagIDs,
            elements: entry.elements + [element],
            createdAt: entry.createdAt
        )
    }

    private static func validate(entries: [GalleryEntry], registry: GalleryTagRegistry) throws {
        var entryIDs = Set<String>()
        var elementIDs = Set<String>()

        for entry in entries {
            guard !entry.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw GalleryCatalogError.emptyEntryTitle
            }
            guard entryIDs.insert(entry.id).inserted else {
                throw GalleryCatalogError.duplicateEntryID(entry.id)
            }

            for tagID in entry.tagIDs + entry.elements.flatMap(\.tagIDs) {
                guard registry.tag(id: tagID) != nil else {
                    throw GalleryCatalogError.unknownTag(entryID: entry.id, tagID: tagID)
                }
            }

            for element in entry.elements {
                guard elementIDs.insert(element.id).inserted else {
                    throw GalleryCatalogError.duplicateElementID(element.id)
                }
            }
        }
    }
}
