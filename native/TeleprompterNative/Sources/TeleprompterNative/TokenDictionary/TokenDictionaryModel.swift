import Combine
import Foundation

enum TokenRecordKind: String, Codable, CaseIterable, Hashable, Sendable {
    case atom
    case bundle
    case preset
    case editRecipe

    var displayName: String {
        switch self {
        case .atom: "Atom"
        case .bundle: "Bundle"
        case .preset: "Preset"
        case .editRecipe: "Edit recipe"
        }
    }

    var iconName: String {
        switch self {
        case .atom: "circle.dotted"
        case .bundle: "square.stack.3d.up"
        case .preset: "wand.and.stars"
        case .editRecipe: "slider.horizontal.3"
        }
    }
}

enum TokenCategory: String, Codable, CaseIterable, Hashable, Sendable {
    case optics
    case stage
    case finish
    case presets
    case edits
    case constraints
    case output
    case custom

    static var browseOrder: [TokenCategory] {
        [.optics, .stage, .finish, .presets, .edits, .constraints, .output, .custom]
    }

    var displayName: String {
        switch self {
        case .optics: "Optics"
        case .stage: "Stage"
        case .finish: "Finish"
        case .presets: "Presets"
        case .edits: "Edits"
        case .constraints: "Constraints"
        case .output: "Output"
        case .custom: "Custom"
        }
    }

    var iconName: String {
        switch self {
        case .optics: "camera.aperture"
        case .stage: "square.3.layers.3d"
        case .finish: "circle.lefthalf.filled"
        case .presets: "wand.and.stars"
        case .edits: "slider.horizontal.3"
        case .constraints: "checkmark.shield"
        case .output: "rectangle.and.arrow.up.right"
        case .custom: "plus"
        }
    }

    var order: Int {
        Self.browseOrder.firstIndex(of: self) ?? Int.max
    }
}

enum TokenSource: String, Codable, Hashable, Sendable {
    case bundled
    case user

    var displayName: String {
        switch self {
        case .bundled: "Built-in"
        case .user: "Your addition"
        }
    }
}

struct TokenExample: Codable, Hashable, Identifiable, Sendable {
    let id: String
    let title: String
    let prompt: String

    init(id: String, title: String, prompt: String) {
        self.id = id
        self.title = title
        self.prompt = prompt
    }
}

struct PromptToken: Codable, Hashable, Identifiable, Sendable {
    let id: String
    var kind: TokenRecordKind
    var label: String
    var shorthand: String
    var aliases: [String]
    var tags: [String]
    var category: TokenCategory
    var axis: String?
    var summary: String
    var expansion: String
    var examples: [TokenExample]
    var components: [String]
    var placeholders: [String]
    var source: TokenSource
    var sortOrder: Int

    init(
        id: String,
        kind: TokenRecordKind,
        label: String,
        shorthand: String,
        aliases: [String] = [],
        tags: [String] = [],
        category: TokenCategory,
        axis: String? = nil,
        summary: String,
        expansion: String,
        examples: [TokenExample] = [],
        components: [String] = [],
        placeholders: [String] = [],
        source: TokenSource = .bundled,
        sortOrder: Int = 0
    ) {
        self.id = id
        self.kind = kind
        self.label = label
        self.shorthand = shorthand
        self.aliases = aliases
        self.tags = tags
        self.category = category
        self.axis = axis
        self.summary = summary
        self.expansion = expansion
        self.examples = examples
        self.components = components
        self.placeholders = placeholders
        self.source = source
        self.sortOrder = sortOrder
    }

    var isUserAddition: Bool { source == .user }

    var searchableValues: [String] {
        [label, shorthand, summary, expansion]
            + aliases
            + tags
            + examples.flatMap { [$0.title, $0.prompt] }
    }
}

enum TokenDictionaryValidationError: LocalizedError, Equatable {
    case missingLabel
    case missingShorthand
    case missingSummary
    case duplicateShorthand

    var errorDescription: String? {
        switch self {
        case .missingLabel: "Give the token a name."
        case .missingShorthand: "Add the shorthand you want to copy into a prompt."
        case .missingSummary: "Add one sentence that explains the direction."
        case .duplicateShorthand: "That shorthand already exists in the dictionary."
        }
    }
}

protocol TokenDictionaryPersistence {
    func loadUserTokens() -> [PromptToken]
    func saveUserTokens(_ tokens: [PromptToken])
}

struct UserDefaultsTokenDictionaryPersistence: TokenDictionaryPersistence {
    private struct Envelope: Codable {
        let schemaVersion: Int
        let tokens: [PromptToken]
    }

    private let defaults: UserDefaults
    private let key: String

    init(
        defaults: UserDefaults = .standard,
        key: String = "teleprompter.native.token-dictionary.user-additions"
    ) {
        self.defaults = defaults
        self.key = key
    }

    func loadUserTokens() -> [PromptToken] {
        guard let data = defaults.data(forKey: key) else { return [] }

        do {
            let envelope = try JSONDecoder().decode(Envelope.self, from: data)
            guard envelope.schemaVersion == 1 else { return [] }
            return envelope.tokens.filter { $0.source == .user && !$0.id.isEmpty }
        } catch {
            // A corrupt addition file must not prevent the dictionary from opening.
            // Leave the bytes untouched so a future recovery path can inspect them.
            return []
        }
    }

    func saveUserTokens(_ tokens: [PromptToken]) {
        let envelope = Envelope(schemaVersion: 1, tokens: tokens)
        guard let data = try? JSONEncoder().encode(envelope) else { return }
        defaults.set(data, forKey: key)
    }
}

final class InMemoryTokenDictionaryPersistence: TokenDictionaryPersistence {
    private(set) var tokens: [PromptToken] = []

    func loadUserTokens() -> [PromptToken] { tokens }

    func saveUserTokens(_ tokens: [PromptToken]) {
        self.tokens = tokens
    }

    // Use this small reference-backed adapter from a focused model test or preview
    // without touching the user's defaults.
    init(tokens: [PromptToken] = []) {
        self.tokens = tokens
    }
}

final class TokenDictionaryModel: ObservableObject {
    let bundledTokens: [PromptToken]

    @Published private(set) var userTokens: [PromptToken]
    @Published var query = ""
    @Published var selectedCategory: TokenCategory?
    @Published var selectedTag: String?
    @Published var selectedTokenID: String?
    @Published var isAddSheetPresented = false

    private let persistence: any TokenDictionaryPersistence

    init(
        bundledTokens: [PromptToken] = TokenDictionarySeed.records,
        persistence: any TokenDictionaryPersistence = UserDefaultsTokenDictionaryPersistence()
    ) {
        self.bundledTokens = bundledTokens
        self.persistence = persistence

        let bundledIDs = Set(bundledTokens.map(\.id))
        let loaded = persistence.loadUserTokens().filter {
            $0.source == .user && !bundledIDs.contains($0.id)
        }
        userTokens = Self.uniqueTokens(loaded)
        selectedTokenID = bundledTokens.first?.id ?? userTokens.first?.id
    }

    var allTokens: [PromptToken] {
        bundledTokens + userTokens
    }

    var selectedToken: PromptToken? {
        guard let selectedTokenID else { return nil }
        return allTokens.first { $0.id == selectedTokenID }
    }

    var filteredTokens: [PromptToken] {
        let trimmedQuery = Self.normalized(query)
        let ranked = allTokens.compactMap { token -> (PromptToken, Int)? in
            guard selectedCategory == nil || selectedCategory == token.category else { return nil }
            guard selectedTag == nil || token.tags.contains(where: { Self.normalized($0) == Self.normalized(selectedTag ?? "") }) else { return nil }

            let score = trimmedQuery.isEmpty ? 0 : Self.searchScore(for: token, query: trimmedQuery)
            guard trimmedQuery.isEmpty || score > 0 else { return nil }
            return (token, score)
        }

        return ranked.sorted { lhs, rhs in
            if lhs.1 != rhs.1 { return lhs.1 > rhs.1 }
            if lhs.0.category.order != rhs.0.category.order { return lhs.0.category.order < rhs.0.category.order }
            if lhs.0.sortOrder != rhs.0.sortOrder { return lhs.0.sortOrder < rhs.0.sortOrder }
            return lhs.0.label.localizedCaseInsensitiveCompare(rhs.0.label) == .orderedAscending
        }.map(\.0)
    }

    var availableCategories: [TokenCategory] {
        let present = Set(allTokens.map(\.category))
        return TokenCategory.browseOrder.filter { present.contains($0) }
    }

    var availableTags: [String] {
        let values = Set(allTokens.flatMap(\.tags).filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty })
        return values.sorted { lhs, rhs in
            Self.normalized(lhs) < Self.normalized(rhs)
        }
    }

    var resultSummary: String {
        let count = filteredTokens.count
        return "\(count) \(count == 1 ? "direction" : "directions")"
    }

    func select(_ token: PromptToken) {
        selectedTokenID = token.id
    }

    func clearFilters() {
        query = ""
        selectedCategory = nil
        selectedTag = nil
    }

    @discardableResult
    func addUserToken(
        label: String,
        shorthand: String,
        category: TokenCategory,
        aliasesText: String,
        tagsText: String,
        summary: String,
        expansion: String,
        exampleText: String
    ) -> Result<PromptToken, TokenDictionaryValidationError> {
        let cleanLabel = clean(label)
        let cleanShorthand = clean(shorthand)
        let cleanSummary = clean(summary)
        let cleanExpansion = clean(expansion)

        guard !cleanLabel.isEmpty else { return .failure(.missingLabel) }
        guard !cleanShorthand.isEmpty else { return .failure(.missingShorthand) }
        guard !cleanSummary.isEmpty else { return .failure(.missingSummary) }
        guard !allTokens.contains(where: { Self.normalized($0.shorthand) == Self.normalized(cleanShorthand) }) else {
            return .failure(.duplicateShorthand)
        }

        let tokenID = "user.token.\(UUID().uuidString.lowercased())"
        let example = clean(exampleText).isEmpty
            ? []
            : [TokenExample(
                id: "\(tokenID).example.1",
                title: "Usage example",
                prompt: clean(exampleText)
            )]
        let token = PromptToken(
            id: tokenID,
            kind: .atom,
            label: cleanLabel,
            shorthand: cleanShorthand,
            aliases: splitList(aliasesText),
            tags: splitList(tagsText),
            category: category,
            summary: cleanSummary,
            expansion: cleanExpansion.isEmpty ? cleanShorthand : cleanExpansion,
            examples: example,
            source: .user,
            sortOrder: userTokens.count + 1
        )

        userTokens.append(token)
        persistence.saveUserTokens(userTokens)
        selectedTokenID = token.id
        return .success(token)
    }

    func removeUserToken(_ token: PromptToken) {
        guard token.source == .user else { return }
        userTokens.removeAll { $0.id == token.id }
        persistence.saveUserTokens(userTokens)
        if selectedTokenID == token.id {
            selectedTokenID = filteredTokens.first?.id ?? bundledTokens.first?.id
        }
    }

    func copyText(for token: PromptToken) -> String {
        token.shorthand
    }

    private func clean(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func splitList(_ value: String) -> [String] {
        var seen = Set<String>()
        return value
            .split(whereSeparator: { $0 == "," || $0 == "\n" })
            .map { clean(String($0)) }
            .filter { !$0.isEmpty }
            .filter { seen.insert(Self.normalized($0)).inserted }
    }

    private static func uniqueTokens(_ tokens: [PromptToken]) -> [PromptToken] {
        var seenIDs = Set<String>()
        var seenShorthands = Set<String>()
        return tokens.filter { token in
            let shorthand = normalized(token.shorthand)
            guard !token.id.isEmpty, !shorthand.isEmpty else { return false }
            guard seenIDs.insert(token.id).inserted else { return false }
            return seenShorthands.insert(shorthand).inserted
        }
    }

    private static func searchScore(for token: PromptToken, query: String) -> Int {
        let terms = query.split(separator: " ").map(String.init)
        let label = normalized(token.label)
        let shorthand = normalized(token.shorthand)
        let aliases = token.aliases.map(normalized)
        let tags = token.tags.map(normalized)
        let otherValues = [normalized(token.summary), normalized(token.expansion)]
            + token.examples.flatMap { [normalized($0.title), normalized($0.prompt)] }

        var total = 0
        for term in terms {
            let best: Int
            if shorthand == term {
                best = 100
            } else if aliases.contains(term) {
                best = 96
            } else if label == term {
                best = 94
            } else if shorthand.hasPrefix(term) || label.hasPrefix(term) {
                best = 82
            } else if aliases.contains(where: { $0.hasPrefix(term) }) {
                best = 76
            } else if tags.contains(term) {
                best = 68
            } else if label.contains(term) || shorthand.contains(term) {
                best = 58
            } else if tags.contains(where: { $0.contains(term) }) {
                best = 48
            } else if otherValues.contains(where: { $0.contains(term) }) {
                best = 30
            } else {
                return 0
            }
            total += best
        }

        return total + (token.source == .user ? 1 : 0)
    }

    fileprivate static func normalized(_ value: String) -> String {
        value
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .replacingOccurrences(
                of: "[^a-z0-9@:_\\-.]+",
                with: " ",
                options: .regularExpression
            )
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
