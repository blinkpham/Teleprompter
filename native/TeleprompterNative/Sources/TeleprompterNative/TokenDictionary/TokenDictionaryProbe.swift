#if TOKEN_DICTIONARY_PROBE
import Foundation

@main
struct TokenDictionaryProbe {
    static func main() throws {
        let references = [
            CueReferenceSlot(
                imageNumber: 1,
                label: "Base portrait",
                role: .base,
                note: "The image to preserve as the base."
            ),
            CueReferenceSlot(
                imageNumber: 2,
                label: "Black bottle",
                role: .product,
                note: "The product reference."
            )
        ]

        let tokenDefinitions = TokenDictionarySeed.records.compactMap { TokenDefinition(token: $0) }
        precondition(tokenDefinitions.count == TokenDictionarySeed.records.count)

        let snippetID = try requireID("snippet.keep-layout")
        let snippet = TokenDefinition.literalSnippet(
            id: snippetID,
            displayLabel: "Keep layout",
            text: "Preserve the current layout and spacing.",
            aliases: ["preserve layout"],
            tags: ["preservation"],
            summary: "Insert a literal layout-preservation direction.",
            order: 100
        )

        let referenceDefinitions = references.enumerated().compactMap { offset, reference in
            reference.definition(order: 101 + offset)
        }
        let dictionary = try TokenDictionary(
            definitions: tokenDefinitions + [snippet] + referenceDefinitions
        )

        let natural50ID = try requireID("atom.camera.focal.natural50")
        let heroID = try requireID("atom.composition.hierarchy.hero")
        let presetID = try requireID("preset.directed-studio.commercial")
        let referenceID = try requireID("reference.image.2")

        precondition(dictionary.availableSlashCommands() == ["edit", "preset", "snippet", "token"])
        precondition(dictionary.lookup(text: "/preset: commercial", trigger: .slash).first?.definition.id == presetID)
        precondition(dictionary.lookup(text: "/token cam:50", trigger: .slash).first?.definition.id == natural50ID)
        precondition(dictionary.lookup(text: "/token: cam:50", trigger: .slash).first?.definition.id == natural50ID)
        precondition(dictionary.lookup(text: "/token:cam:50", trigger: .slash).first?.definition.id == natural50ID)
        precondition(dictionary.lookup(text: "/token comp:hero", trigger: .slash).first?.definition.id == heroID)
        precondition(dictionary.lookup(text: "@Image 2", trigger: .mention, mode: .create).first?.definition.id == referenceID)
        precondition(dictionary.resolveSlash(command: "token", definitionID: natural50ID, mode: .edit)?.id == natural50ID)
        precondition(dictionary.resolveExact("@Image 2", trigger: .mention)?.id == referenceID)
        precondition(dictionary.lookup(text: "/unknown: value", trigger: .slash).isEmpty)
        precondition(dictionary.lookup(text: "/", trigger: .slash).count == TokenDictionary.maximumSuggestionCount)

        guard case let .slash(slash)? = dictionary.insertion(for: snippetID, trigger: .slash) else {
            preconditionFailure("The snippet did not expose a slash insertion form.")
        }
        precondition(slash.command == "snippet")
        precondition(slash.replacement == .literal)
        precondition(slash.literalText == "Preserve the current layout and spacing.")

        let invalidID = try requireID("snippet.invalid")
        let invalid = TokenDefinition(
            id: invalidID,
            category: .snippet,
            displayLabel: "Invalid snippet",
            summary: "Invalid fixture definition.",
            order: 101,
            insertionForms: TokenInsertionForms(
                slash: SlashCommandForm(command: "snippet", replacement: .literal)
            )
        )
        do {
            _ = try TokenDictionary(definitions: [invalid])
            preconditionFailure("An empty literal insertion should have been rejected.")
        } catch let NativeTokenDictionaryError.invalid(issues) {
            precondition(issues.contains { $0.code == .invalidLiteralText })
        }

        let encoded = try JSONEncoder().encode(dictionary)
        let decoded = try JSONDecoder().decode(TokenDictionary.self, from: encoded)
        precondition(decoded.definitions == dictionary.definitions)

        print("TokenDictionary probe passed: \(dictionary.definitions.count) definitions; slash, mention, validation, mode, and Codable checks.")
    }

    private static func requireID(_ rawValue: String) throws -> TokenStableID {
        guard let id = TokenStableID(rawValue) else {
            throw NativeTokenDictionaryError.invalid([
                TokenDictionaryIssue(
                    code: .invalidSlashCommand,
                    definitionID: nil,
                    message: "Invalid fixture ID: \(rawValue)"
                )
            ])
        }
        return id
    }
}
#endif
