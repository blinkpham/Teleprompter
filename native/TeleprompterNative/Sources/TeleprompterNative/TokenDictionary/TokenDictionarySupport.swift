import Foundation

/// The two authoring contexts that can consume the same local dictionary.
enum CueTokenMode: String, Codable, CaseIterable, Hashable, Sendable {
    case create
    case edit
}

/// A stable, lowercase, namespaced identifier. Labels may change without changing this value.
struct TokenStableID: Codable, Hashable, Identifiable, Sendable, CustomStringConvertible {
    let rawValue: String

    init?(_ rawValue: String) {
        guard Self.isValid(rawValue) else { return nil }
        self.rawValue = rawValue
    }

    var id: String { rawValue }
    var description: String { rawValue }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)
        guard let value = Self(rawValue) else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Token IDs must be lowercase namespaced values."
            )
        }
        self = value
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }

    private static func isValid(_ value: String) -> Bool {
        guard value.count <= 128, !value.isEmpty else { return false }

        var previousWasSeparator = false
        for (index, scalar) in value.unicodeScalars.enumerated() {
            let isLowercaseLetter = scalar.value >= 97 && scalar.value <= 122
            let isDigit = scalar.value >= 48 && scalar.value <= 57
            let isSeparator = scalar.value == 45 || scalar.value == 46 || scalar.value == 95

            guard isLowercaseLetter || isDigit || isSeparator else { return false }
            if index == 0 || index == value.unicodeScalars.count - 1 {
                guard !isSeparator else { return false }
            }
            if isSeparator {
                guard !previousWasSeparator else { return false }
                previousWasSeparator = true
            } else {
                previousWasSeparator = false
            }
        }
        return true
    }
}

/// The local reference roles mirror the existing draft contract without owning draft semantics.
enum CueReferenceRole: String, Codable, CaseIterable, Hashable, Sendable {
    case base
    case identity
    case pose
    case product
    case style
    case palette
    case lighting
    case background
    case geometry
    case custom

    var displayName: String {
        switch self {
        case .base: "Base"
        case .identity: "Identity"
        case .pose: "Pose"
        case .product: "Product"
        case .style: "Style"
        case .palette: "Palette"
        case .lighting: "Lighting"
        case .background: "Background"
        case .geometry: "Geometry"
        case .custom: "Custom"
        }
    }
}

enum TokenTrigger: String, Codable, CaseIterable, Hashable, Sendable {
    case slash
    case mention

    var symbol: String {
        switch self {
        case .slash: "/"
        case .mention: "@"
        }
    }
}

/// These categories describe dictionary browsing. Slash commands remain explicit forms,
/// so Optics/Stage/Finish records can all use the `/token` command without losing their label.
enum CueTokenCategory: String, Codable, CaseIterable, Hashable, Sendable {
    case optics
    case stage
    case finish
    case preset
    case edit
    case snippet
    case reference
    case constraints
    case output
    case custom

    static var browseOrder: [CueTokenCategory] {
        [.optics, .stage, .finish, .preset, .edit, .snippet, .reference, .constraints, .output, .custom]
    }

    var displayName: String {
        switch self {
        case .optics: "Optics"
        case .stage: "Stage"
        case .finish: "Finish"
        case .preset: "Presets"
        case .edit: "Edits"
        case .snippet: "Snippets"
        case .reference: "References"
        case .constraints: "Constraints"
        case .output: "Output"
        case .custom: "Custom"
        }
    }

    var order: Int { Self.browseOrder.firstIndex(of: self) ?? Int.max }

    var slashCommand: String? {
        switch self {
        case .preset: "preset"
        case .edit: "edit"
        case .snippet: "snippet"
        case .reference: nil
        case .optics, .stage, .finish, .constraints, .output, .custom: "token"
        }
    }

    static func fromSlashCommand(_ command: String) -> CueTokenCategory? {
        let categories = categories(forSlashCommand: command)
        guard categories?.count == 1 else { return nil }
        return categories?.first
    }

    static func categories(forSlashCommand command: String) -> Set<CueTokenCategory>? {
        let normalized = TokenDictionary.normalize(command).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        switch normalized {
        case "preset": return [.preset]
        case "edit": return [.edit]
        case "snippet": return [.snippet]
        case "token": return [.optics, .stage, .finish, .constraints, .output, .custom]
        default: return nil
        }
    }
}

enum TokenDefinitionStatus: String, Codable, Hashable, Sendable {
    case active
    case deprecated
}

enum SlashReplacement: String, Codable, Hashable, Sendable {
    case semantic
    case literal
}

struct SlashCommandForm: Codable, Hashable, Sendable {
    let command: String
    let replacement: SlashReplacement
    let literalText: String?

    init(command: String, replacement: SlashReplacement, literalText: String? = nil) {
        self.command = command
        self.replacement = replacement
        self.literalText = literalText
    }

    var triggerText: String { "/\(command)" }
}

struct ReferenceMentionForm: Codable, Hashable, Sendable {
    let imageNumber: Int
    let insertedText: String

    init(imageNumber: Int, insertedText: String? = nil) {
        self.imageNumber = imageNumber
        self.insertedText = insertedText ?? "Image \(imageNumber)"
    }

    var triggerText: String { "@\(insertedText)" }
}

struct TokenInsertionForms: Codable, Hashable, Sendable {
    let slash: SlashCommandForm?
    let mention: ReferenceMentionForm?

    init(slash: SlashCommandForm? = nil, mention: ReferenceMentionForm? = nil) {
        self.slash = slash
        self.mention = mention
    }

    var isEmpty: Bool { slash == nil && mention == nil }

    func form(for trigger: TokenTrigger) -> TokenInsertionForm? {
        switch trigger {
        case .slash: slash.map(TokenInsertionForm.slash)
        case .mention: mention.map(TokenInsertionForm.mention)
        }
    }
}

enum TokenInsertionForm: Hashable, Sendable {
    case slash(SlashCommandForm)
    case mention(ReferenceMentionForm)
}

/// A numbered reference is stable by image number for the life of a draft.
struct CueReferenceSlot: Codable, Hashable, Sendable {
    let imageNumber: Int
    let label: String
    let role: CueReferenceRole?
    let note: String
    let aliases: [String]

    init(
        imageNumber: Int,
        label: String,
        role: CueReferenceRole? = nil,
        note: String = "",
        aliases: [String] = []
    ) {
        self.imageNumber = imageNumber
        self.label = label
        self.role = role
        self.note = note
        self.aliases = aliases
    }

    var stableID: TokenStableID? {
        TokenStableID("reference.image.\(imageNumber)")
    }

    var displayLabel: String {
        var parts = ["Image \(imageNumber)"]
        if let role { parts.append(role.displayName) }
        let cleanLabel = label.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanLabel.isEmpty { parts.append(cleanLabel) }
        return parts.joined(separator: " · ")
    }

    var mention: ReferenceMentionForm {
        ReferenceMentionForm(imageNumber: imageNumber)
    }

    func definition(order: Int, applicability: [CueTokenMode] = CueTokenMode.allCases) -> TokenDefinition? {
        guard let stableID else { return nil }
        return TokenDefinition(
            id: stableID,
            category: .reference,
            displayLabel: displayLabel,
            shorthand: nil,
            aliases: aliases,
            tags: role.map { [$0.rawValue] } ?? [],
            summary: note.isEmpty ? "Reference image \(imageNumber)." : note,
            expansion: nil,
            applicability: applicability,
            status: .active,
            order: order,
            insertionForms: TokenInsertionForms(mention: mention)
        )
    }
}

struct TokenDefinition: Codable, Hashable, Identifiable, Sendable {
    let id: TokenStableID
    let category: CueTokenCategory
    let displayLabel: String
    let shorthand: String?
    let aliases: [String]
    let tags: [String]
    let summary: String
    let expansion: String?
    let applicability: [CueTokenMode]
    let status: TokenDefinitionStatus
    let order: Int
    let insertionForms: TokenInsertionForms

    init(
        id: TokenStableID,
        category: CueTokenCategory,
        displayLabel: String,
        shorthand: String? = nil,
        aliases: [String] = [],
        tags: [String] = [],
        summary: String,
        expansion: String? = nil,
        applicability: [CueTokenMode] = CueTokenMode.allCases,
        status: TokenDefinitionStatus = .active,
        order: Int = 0,
        insertionForms: TokenInsertionForms
    ) {
        self.id = id
        self.category = category
        self.displayLabel = displayLabel
        self.shorthand = shorthand
        self.aliases = aliases
        self.tags = tags
        self.summary = summary
        self.expansion = expansion
        self.applicability = applicability
        self.status = status
        self.order = order
        self.insertionForms = insertionForms
    }

    /// Projects the existing bundled/user record without copying its prompt semantics into the bridge.
    init?(token: PromptToken, applicability: [CueTokenMode] = CueTokenMode.allCases) {
        guard let stableID = TokenStableID(token.id) else { return nil }

        let category: CueTokenCategory
        switch token.category {
        case .optics: category = .optics
        case .stage: category = .stage
        case .finish: category = .finish
        case .presets: category = .preset
        case .edits: category = .edit
        case .constraints: category = .constraints
        case .output: category = .output
        case .custom: category = .custom
        }

        let command: String
        let replacement: SlashReplacement
        switch token.kind {
        case .preset: command = "preset"; replacement = .semantic
        case .editRecipe: command = "edit"; replacement = .semantic
        case .atom, .bundle: command = "token"; replacement = .semantic
        }

        self.init(
            id: stableID,
            category: category,
            displayLabel: token.label,
            shorthand: token.shorthand.isEmpty ? nil : token.shorthand,
            aliases: token.aliases,
            tags: token.tags,
            summary: token.summary,
            expansion: token.expansion.isEmpty ? nil : token.expansion,
            applicability: applicability,
            status: .active,
            order: token.sortOrder,
            insertionForms: TokenInsertionForms(
                slash: SlashCommandForm(command: command, replacement: replacement)
            )
        )
    }

    static func literalSnippet(
        id: TokenStableID,
        displayLabel: String,
        text: String,
        aliases: [String] = [],
        tags: [String] = [],
        summary: String,
        order: Int = 0,
        applicability: [CueTokenMode] = CueTokenMode.allCases
    ) -> TokenDefinition {
        TokenDefinition(
            id: id,
            category: .snippet,
            displayLabel: displayLabel,
            aliases: aliases,
            tags: tags,
            summary: summary,
            expansion: text,
            applicability: applicability,
            order: order,
            insertionForms: TokenInsertionForms(
                slash: SlashCommandForm(command: "snippet", replacement: .literal, literalText: text)
            )
        )
    }

    func insertion(for trigger: TokenTrigger) -> TokenInsertionForm? {
        insertionForms.form(for: trigger)
    }
}

enum TokenDictionaryIssueCode: String, Codable, Hashable, Sendable {
    case invalidID
    case duplicateID
    case duplicateReferenceNumber
    case emptyLabel
    case emptySummary
    case duplicateAlias
    case invalidApplicability
    case invalidOrder
    case missingSlashForm
    case missingMentionForm
    case unexpectedSlashForm
    case unexpectedMentionForm
    case invalidSlashCommand
    case invalidLiteralText
    case invalidMention
    case ambiguousSearchTerm
}

struct TokenDictionaryIssue: Codable, Equatable, Hashable, Sendable, CustomStringConvertible {
    let code: TokenDictionaryIssueCode
    let definitionID: TokenStableID?
    let message: String

    var description: String {
        if let definitionID { return "\(definitionID): \(message)" }
        return message
    }
}

enum NativeTokenDictionaryError: Error, Equatable, LocalizedError, Sendable {
    case invalid([TokenDictionaryIssue])

    var errorDescription: String? {
        switch self {
        case let .invalid(issues):
            return issues.map(\.description).joined(separator: " ")
        }
    }
}

enum TokenMatchKind: Int, Codable, Hashable, Sendable {
    case empty
    case exact
    case prefix
    case contains

    fileprivate var rank: Int {
        switch self {
        case .empty, .exact: 0
        case .prefix: 1
        case .contains: 2
        }
    }
}

enum TokenMatchField: Int, Codable, Hashable, Sendable {
    case displayLabel
    case shorthand
    case alias
    case tag
    case summary
    case expansion
    case id
    case mention

    fileprivate var rank: Int { rawValue }
}

struct TokenMatch: Codable, Hashable, Sendable {
    let kind: TokenMatchKind
    let field: TokenMatchField
}

struct TokenLookupQuery: Hashable, Sendable {
    let text: String
    let trigger: TokenTrigger?
    let mode: CueTokenMode?
    let limit: Int

    init(text: String, trigger: TokenTrigger? = nil, mode: CueTokenMode? = nil, limit: Int = TokenDictionary.maximumSuggestionCount) {
        self.text = text
        self.trigger = trigger
        self.mode = mode
        self.limit = max(0, min(limit, TokenDictionary.maximumSuggestionCount))
    }
}

struct TokenSuggestion: Codable, Hashable, Identifiable, Sendable {
    let definition: TokenDefinition
    let trigger: TokenTrigger?
    let match: TokenMatch

    var id: TokenStableID { definition.id }
    var displayLabel: String { definition.displayLabel }
    var categoryLabel: String { definition.category.displayName }
}

struct TokenDictionary: Codable, Sendable {
    static let maximumSuggestionCount = 6

    let definitions: [TokenDefinition]

    init(definitions: [TokenDefinition]) throws {
        let issues = Self.validationIssues(for: definitions)
        guard issues.isEmpty else { throw NativeTokenDictionaryError.invalid(issues) }
        self.definitions = definitions
    }

    init(tokens: [PromptToken], references: [CueReferenceSlot] = []) throws {
        var definitions: [TokenDefinition] = []
        for token in tokens {
            guard let definition = TokenDefinition(token: token) else {
                let issue = TokenDictionaryIssue(
                    code: .invalidID,
                    definitionID: TokenStableID(token.id),
                    message: "The record ID is not a valid stable token ID."
                )
                throw NativeTokenDictionaryError.invalid([issue])
            }
            definitions.append(definition)
        }

        let nextOrder = (definitions.map(\.order).max() ?? -1) + 1
        for (offset, reference) in references.enumerated() {
            guard let definition = reference.definition(order: nextOrder + offset) else {
                let issue = TokenDictionaryIssue(
                    code: .invalidMention,
                    definitionID: reference.stableID,
                    message: "Reference slots need an image number from 1 through 20."
                )
                throw NativeTokenDictionaryError.invalid([issue])
            }
            definitions.append(definition)
        }

        try self.init(definitions: definitions)
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        try self.init(definitions: container.decode([TokenDefinition].self))
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(definitions)
    }

    func definition(for id: TokenStableID) -> TokenDefinition? {
        definitions.first { $0.id == id }
    }

    func definition(for rawID: String) -> TokenDefinition? {
        guard let id = TokenStableID(rawID) else { return nil }
        return definition(for: id)
    }

    func reference(imageNumber: Int) -> TokenDefinition? {
        definitions.first {
            $0.insertionForms.mention?.imageNumber == imageNumber && $0.status == .active
        }
    }

    func availableSlashCommands() -> [String] {
        Array(Set(definitions.compactMap { $0.insertionForms.slash?.command }))
            .sorted()
    }

    func lookup(_ query: TokenLookupQuery) -> [TokenSuggestion] {
        guard query.limit > 0 else { return [] }
        let parsed = Self.parse(query)
        guard !parsed.isInvalid else { return [] }

        var suggestions: [TokenSuggestion] = []
        for definition in definitions {
            guard definition.status == .active else { continue }
            if let mode = query.mode, !definition.applicability.contains(mode) { continue }
            if let categories = parsed.categories, !categories.contains(definition.category) { continue }
            if let trigger = parsed.trigger, definition.insertion(for: trigger) == nil { continue }
            guard let match = Self.bestMatch(for: definition, query: parsed.term, trigger: parsed.trigger) else { continue }
            suggestions.append(TokenSuggestion(definition: definition, trigger: parsed.trigger, match: match))
        }

        suggestions.sort { lhs, rhs in
            if lhs.match.kind.rank != rhs.match.kind.rank { return lhs.match.kind.rank < rhs.match.kind.rank }
            if lhs.match.field.rank != rhs.match.field.rank { return lhs.match.field.rank < rhs.match.field.rank }
            if lhs.definition.category.order != rhs.definition.category.order { return lhs.definition.category.order < rhs.definition.category.order }
            if lhs.definition.order != rhs.definition.order { return lhs.definition.order < rhs.definition.order }
            return lhs.definition.id.rawValue < rhs.definition.id.rawValue
        }
        return Array(suggestions.prefix(query.limit))
    }

    func lookup(
        text: String,
        trigger: TokenTrigger? = nil,
        mode: CueTokenMode? = nil,
        limit: Int = TokenDictionary.maximumSuggestionCount
    ) -> [TokenSuggestion] {
        lookup(TokenLookupQuery(text: text, trigger: trigger, mode: mode, limit: limit))
    }

    /// Returns a result only when one active definition exactly owns the query.
    func resolveExact(
        _ text: String,
        trigger: TokenTrigger,
        mode: CueTokenMode? = nil
    ) -> TokenDefinition? {
        let matches = lookup(text: text, trigger: trigger, mode: mode, limit: Self.maximumSuggestionCount)
            .filter { $0.match.kind == .exact }
        guard matches.count == 1 else { return nil }
        return matches[0].definition
    }

    func resolveSlash(
        command: String,
        definitionID: TokenStableID,
        mode: CueTokenMode? = nil
    ) -> TokenDefinition? {
        guard let definition = definition(for: definitionID), definition.status == .active else { return nil }
        guard let slash = definition.insertionForms.slash else { return nil }
        guard Self.normalize(slash.command) == Self.normalize(command) else { return nil }
        if let mode, !definition.applicability.contains(mode) { return nil }
        return definition
    }

    func insertion(
        for definitionID: TokenStableID,
        trigger: TokenTrigger,
        mode: CueTokenMode? = nil
    ) -> TokenInsertionForm? {
        guard let definition = definition(for: definitionID), definition.status == .active else { return nil }
        if let mode, !definition.applicability.contains(mode) { return nil }
        return definition.insertion(for: trigger)
    }

    static func validationIssues(for definitions: [TokenDefinition]) -> [TokenDictionaryIssue] {
        var issues: [TokenDictionaryIssue] = []
        var ids = Set<TokenStableID>()
        var referenceNumbers = Set<Int>()
        var searchOwners: [String: TokenStableID] = [:]

        for definition in definitions {
            if !ids.insert(definition.id).inserted {
                issues.append(TokenDictionaryIssue(code: .duplicateID, definitionID: definition.id, message: "The stable token ID is repeated."))
            }

            let label = definition.displayLabel.trimmingCharacters(in: .whitespacesAndNewlines)
            if label.isEmpty {
                issues.append(TokenDictionaryIssue(code: .emptyLabel, definitionID: definition.id, message: "Display labels cannot be empty."))
            }
            if definition.summary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                issues.append(TokenDictionaryIssue(code: .emptySummary, definitionID: definition.id, message: "Token summaries cannot be empty."))
            }
            if definition.order < 0 {
                issues.append(TokenDictionaryIssue(code: .invalidOrder, definitionID: definition.id, message: "Sort order must be non-negative."))
            }
            if definition.applicability.isEmpty || Set(definition.applicability).count != definition.applicability.count {
                issues.append(TokenDictionaryIssue(code: .invalidApplicability, definitionID: definition.id, message: "Applicability must contain each Cue mode at most once."))
            }

            validateForms(for: definition, issues: &issues)

            if let mention = definition.insertionForms.mention {
                if !referenceNumbers.insert(mention.imageNumber).inserted {
                    issues.append(TokenDictionaryIssue(code: .duplicateReferenceNumber, definitionID: definition.id, message: "Reference image numbers must be unique."))
                }
            }

            for term in exactSearchTerms(for: definition) {
                let key = normalize(term)
                guard !key.isEmpty else { continue }
                if let owner = searchOwners[key], owner != definition.id {
                    issues.append(TokenDictionaryIssue(code: .ambiguousSearchTerm, definitionID: definition.id, message: "The exact search term \(term) is already owned by \(owner.rawValue)."))
                } else {
                    searchOwners[key] = definition.id
                }
            }
        }
        return issues
    }

    fileprivate static func normalize(_ value: String) -> String {
        value
            .folding(options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive], locale: Locale(identifier: "en_US_POSIX"))
            .split(whereSeparator: { $0.isWhitespace })
            .joined(separator: " ")
    }

    private struct ParsedQuery {
        let trigger: TokenTrigger?
        let categories: Set<CueTokenCategory>?
        let term: String
        let isInvalid: Bool
    }

    private struct Candidate {
        let match: TokenMatch
    }

    private static func parse(_ query: TokenLookupQuery) -> ParsedQuery {
        let raw = query.text.trimmingCharacters(in: .whitespacesAndNewlines)
        let inferredTrigger: TokenTrigger?
        if query.trigger == nil, raw.hasPrefix("/") { inferredTrigger = .slash }
        else if query.trigger == nil, raw.hasPrefix("@") { inferredTrigger = .mention }
        else { inferredTrigger = query.trigger }

        guard let trigger = inferredTrigger else {
            return ParsedQuery(trigger: nil, categories: nil, term: normalize(raw), isInvalid: false)
        }

        if trigger == .slash && raw.hasPrefix("@") || trigger == .mention && raw.hasPrefix("/") {
            return ParsedQuery(trigger: trigger, categories: nil, term: "", isInvalid: true)
        }

        let prefix = trigger.symbol
        let body = raw.hasPrefix(prefix) ? String(raw.dropFirst()) : raw
        guard trigger == .slash else {
            return ParsedQuery(trigger: .mention, categories: [.reference], term: normalize(body), isInvalid: false)
        }

        let normalizedBody = normalize(body)
        guard !normalizedBody.isEmpty else {
            return ParsedQuery(trigger: .slash, categories: nil, term: "", isInvalid: false)
        }

        let parts = normalizedBody.split(separator: " ", maxSplits: 1, omittingEmptySubsequences: true)
        guard let first = parts.first else {
            return ParsedQuery(trigger: .slash, categories: nil, term: "", isInvalid: false)
        }

        let firstWord = String(first)
        if let colon = firstWord.firstIndex(of: ":") {
            let command = String(firstWord[..<colon])
            guard let categories = CueTokenCategory.categories(forSlashCommand: command) else {
                return ParsedQuery(trigger: .slash, categories: nil, term: "", isInvalid: true)
            }
            let inlineTerm = String(firstWord[firstWord.index(after: colon)...])
            let trailingTerm = parts.count == 2 ? String(parts[1]) : ""
            let term = [inlineTerm, trailingTerm]
                .filter { !$0.isEmpty }
                .joined(separator: " ")
            return ParsedQuery(trigger: .slash, categories: categories, term: normalize(term), isInvalid: false)
        }

        if let categories = CueTokenCategory.categories(forSlashCommand: firstWord) {
            let remainder = parts.count == 2 ? String(parts[1]) : ""
            return ParsedQuery(trigger: .slash, categories: categories, term: normalize(remainder), isInvalid: false)
        }

        return ParsedQuery(trigger: .slash, categories: nil, term: normalizedBody, isInvalid: false)
    }

    private static func bestMatch(for definition: TokenDefinition, query: String, trigger: TokenTrigger?) -> TokenMatch? {
        if query.isEmpty { return TokenMatch(kind: .empty, field: .displayLabel) }

        var best: TokenMatch?
        for (field, value) in searchableFields(for: definition, trigger: trigger) {
            let normalizedValue = normalize(value)
            let match: TokenMatch?
            if normalizedValue == query { match = TokenMatch(kind: .exact, field: field) }
            else if normalizedValue.hasPrefix(query) { match = TokenMatch(kind: .prefix, field: field) }
            else if normalizedValue.contains(query) { match = TokenMatch(kind: .contains, field: field) }
            else { match = nil }

            guard let match else { continue }
            if let currentBest = best,
               !(match.kind.rank < currentBest.kind.rank
                 || match.kind.rank == currentBest.kind.rank && match.field.rank < currentBest.field.rank) {
                continue
            }
            best = match
        }
        return best
    }

    private static func searchableFields(for definition: TokenDefinition, trigger: TokenTrigger?) -> [(TokenMatchField, String)] {
        var fields: [(TokenMatchField, String)] = [(.displayLabel, definition.displayLabel)]
        if let shorthand = definition.shorthand { fields.append((.shorthand, shorthand)) }
        fields += definition.aliases.map { (.alias, $0) }
        fields += definition.tags.map { (.tag, $0) }
        fields.append((.summary, definition.summary))
        if let expansion = definition.expansion { fields.append((.expansion, expansion)) }
        fields.append((.id, definition.id.rawValue))
        if trigger == .mention, let mention = definition.insertionForms.mention {
            fields.append((.mention, mention.insertedText))
        }
        return fields
    }

    private static func exactSearchTerms(for definition: TokenDefinition) -> [String] {
        var terms = [definition.id.rawValue, definition.displayLabel]
        if let shorthand = definition.shorthand { terms.append(shorthand) }
        terms.append(contentsOf: definition.aliases)
        if let mention = definition.insertionForms.mention { terms.append(mention.insertedText) }
        return terms
    }

    private static func validateForms(for definition: TokenDefinition, issues: inout [TokenDictionaryIssue]) {
        let id = definition.id
        switch definition.category {
        case .reference:
            if definition.insertionForms.slash != nil {
                issues.append(TokenDictionaryIssue(code: .unexpectedSlashForm, definitionID: id, message: "Reference entries use @ mentions, not slash commands."))
            }
            guard let mention = definition.insertionForms.mention else {
                issues.append(TokenDictionaryIssue(code: .missingMentionForm, definitionID: id, message: "Reference entries need a numbered @ mention form."))
                return
            }
            if !(1...20).contains(mention.imageNumber) || mention.insertedText != "Image \(mention.imageNumber)" {
                issues.append(TokenDictionaryIssue(code: .invalidMention, definitionID: id, message: "Mentions must insert the literal text Image N for a number from 1 through 20."))
            }
        default:
            if definition.insertionForms.mention != nil {
                issues.append(TokenDictionaryIssue(code: .unexpectedMentionForm, definitionID: id, message: "Only reference entries may expose an @ mention form."))
            }
            guard let slash = definition.insertionForms.slash else {
                issues.append(TokenDictionaryIssue(code: .missingSlashForm, definitionID: id, message: "Prompt records need a slash command form."))
                return
            }
            if let expectedCommand = definition.category.slashCommand,
               slash.command == expectedCommand,
               !slash.command.isEmpty,
               slash.command.allSatisfy({ $0.isLowercase || $0.isNumber || $0 == "-" }) {
                // The category and command agree.
            } else {
                issues.append(TokenDictionaryIssue(code: .invalidSlashCommand, definitionID: id, message: "Slash command does not match the definition category."))
            }
            switch slash.replacement {
            case .semantic where slash.literalText != nil:
                issues.append(TokenDictionaryIssue(code: .invalidLiteralText, definitionID: id, message: "Semantic slash commands cannot carry literal replacement text."))
            case .literal:
                guard let literalText = slash.literalText,
                      !literalText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                    issues.append(TokenDictionaryIssue(code: .invalidLiteralText, definitionID: id, message: "Literal slash commands need non-empty approved insertion text."))
                    return
                }
                if definition.category != .snippet {
                    issues.append(TokenDictionaryIssue(code: .invalidLiteralText, definitionID: id, message: "Only snippets may use literal slash insertion."))
                }
            case .semantic:
                if definition.category == .snippet {
                    issues.append(TokenDictionaryIssue(code: .invalidLiteralText, definitionID: id, message: "Snippets must use literal slash insertion."))
                }
            }
        }
    }
}
