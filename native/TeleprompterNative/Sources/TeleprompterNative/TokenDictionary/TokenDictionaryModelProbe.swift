#if TOKEN_DICTIONARY_MODEL_PROBE
import Foundation

@main
struct TokenDictionaryModelProbe {
    static func main() {
        let persistence = InMemoryTokenDictionaryPersistence()
        let model = TokenDictionaryModel(persistence: persistence)

        precondition(model.allTokens.count == 14, "expected accepted seed count")

        model.query = "cam:50"
        precondition(
            model.filteredTokens.first?.id == "atom.camera.focal.natural50",
            "alias search should rank the exact alias"
        )

        model.query = ""
        model.selectedTag = "compression"
        precondition(
            model.filteredTokens.map(\.id) == ["atom.camera.focal.portrait85"],
            "tag filtering should be exact"
        )

        model.selectedTag = nil
        let result = model.addUserToken(
            label: "Soft daylight",
            shorthand: "light:window",
            category: .stage,
            aliasesText: "daylight, side light",
            tagsText: "daylight, natural",
            summary: "Directional soft daylight.",
            expansion: "Use soft directional daylight from one side.",
            exampleText: "light:window + a quiet morning interior"
        )
        let added: PromptToken
        switch result {
        case let .success(token): added = token
        case let .failure(error): preconditionFailure(error.localizedDescription)
        }

        precondition(
            model.userTokens.count == 1 && model.selectedTokenID == added.id,
            "user token should be selected after saving"
        )

        let duplicate = model.addUserToken(
            label: "Duplicate",
            shorthand: "LIGHT:WINDOW",
            category: .custom,
            aliasesText: "",
            tagsText: "",
            summary: "Duplicate",
            expansion: "",
            exampleText: ""
        )
        precondition(
            duplicate == .failure(.duplicateShorthand),
            "duplicate shorthand should be rejected case-insensitively"
        )

        model.removeUserToken(added)
        precondition(model.userTokens.isEmpty, "user token should be removable")

        print("TokenDictionary model probe passed: search, tags, persistence, duplicate guard, and removal checks.")
    }
}
#endif
