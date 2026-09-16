import AppKit
import SwiftUI

struct TokenDictionaryView: View {
    private let accent = Color.orange
    private let onInsert: ((PromptToken) -> Void)?

    @StateObject private var model: TokenDictionaryModel
    @State private var copiedTokenID: String?
    @State private var removalCandidate: PromptToken?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    init(
        bundledTokens: [PromptToken] = TokenDictionarySeed.records,
        persistence: any TokenDictionaryPersistence = UserDefaultsTokenDictionaryPersistence(),
        onInsert: ((PromptToken) -> Void)? = nil
    ) {
        _model = StateObject(wrappedValue: TokenDictionaryModel(
            bundledTokens: bundledTokens,
            persistence: persistence
        ))
        self.onInsert = onInsert
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            filterBar

            Divider()
                .opacity(0.35)

            HStack(spacing: 0) {
                tokenList

                Divider()
                    .opacity(0.35)

                detailPane
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.clear)
        .sheet(isPresented: $model.isAddSheetPresented) {
            TokenAdditionSheet { draft in
                switch model.addUserToken(
                    label: draft.label,
                    shorthand: draft.shorthand,
                    category: draft.category,
                    aliasesText: draft.aliases,
                    tagsText: draft.tags,
                    summary: draft.summary,
                    expansion: draft.expansion,
                    exampleText: draft.example
                ) {
                case .success:
                    return nil
                case let .failure(error):
                    return error.localizedDescription
                }
            }
        }
        .alert(
            "Remove this addition?",
            isPresented: Binding(
                get: { removalCandidate != nil },
                set: { if !$0 { removalCandidate = nil } }
            )
        ) {
            Button("Remove", role: .destructive) {
                if let removalCandidate {
                    model.removeUserToken(removalCandidate)
                }
                self.removalCandidate = nil
            }
            Button("Cancel", role: .cancel) {
                removalCandidate = nil
            }
        } message: {
            Text("This only removes the saved local addition. Built-in directions stay unchanged.")
        }
        .frame(minWidth: 760, minHeight: 520)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Token dictionary")
                        .font(.system(size: 23, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)

                    Text("Search approved directions by name, shorthand, alias, or tag.")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 12)

                Text(model.resultSummary)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                Button {
                    model.isAddSheetPresented = true
                } label: {
                    Label("Add token", systemImage: "plus")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 12)
                        .frame(minHeight: 34)
                        .dictionaryGlass(
                            in: Capsule(),
                            tint: accent.opacity(0.34),
                            interactive: true,
                            reduceTransparency: reduceTransparency
                        )
                }
                .buttonStyle(DictionaryButtonStyle(reduceMotion: reduceMotion))
                .accessibilityIdentifier("token-dictionary-add")
                .accessibilityHint("Add a local prompt direction with a shorthand, aliases, tags, and an example")
                .help("Add token")
            }

            searchField
        }
        .padding(.horizontal, 24)
        .padding(.top, 22)
        .padding(.bottom, 16)
    }

    private var searchField: some View {
        HStack(spacing: 9) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)

            TextField("Search labels, aliases, tags, and shorthand", text: $model.query)
                .textFieldStyle(.plain)
                .font(.system(size: 13, weight: .regular))
                .accessibilityIdentifier("token-dictionary-search-field")

            if !model.query.isEmpty {
                Button {
                    model.query = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
                .help("Clear search")
            }
        }
        .padding(.horizontal, 12)
        .frame(minHeight: 38)
        .dictionaryGlass(
            in: RoundedRectangle(cornerRadius: 13, style: .continuous),
            interactive: false,
            reduceTransparency: reduceTransparency
        )
    }

    private var filterBar: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 8) {
                Text("Browse")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 7) {
                        filterChip(
                            title: "All",
                            icon: "square.grid.2x2",
                            isSelected: model.selectedCategory == nil
                        ) {
                            model.selectedCategory = nil
                        }

                        ForEach(model.availableCategories, id: \.self) { category in
                            filterChip(
                                title: category.displayName,
                                icon: category.iconName,
                                isSelected: model.selectedCategory == category
                            ) {
                                model.selectedCategory = category
                            }
                        }
                    }
                    .padding(.vertical, 2)
                }

                if model.selectedCategory != nil || model.selectedTag != nil || !model.query.isEmpty {
                    Button("Clear") {
                        model.clearFilters()
                    }
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .buttonStyle(.plain)
                    .foregroundStyle(accent)
                    .accessibilityIdentifier("token-dictionary-clear-filters")
                }
            }

            if !model.availableTags.isEmpty {
                HStack(spacing: 8) {
                    Text("Tags")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(model.availableTags, id: \.self) { tag in
                                filterChip(
                                    title: tag,
                                    icon: "number",
                                    isSelected: model.selectedTag == tag
                                ) {
                                    model.selectedTag = model.selectedTag == tag ? nil : tag
                                }
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 12)
    }

    private func filterChip(
        title: String,
        icon: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 9, weight: .semibold))
                    .accessibilityHidden(true)

                Text(title)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .lineLimit(1)
            }
            .foregroundStyle(isSelected ? Color.black : Color.primary)
            .padding(.horizontal, 9)
            .frame(minHeight: 28)
            .dictionaryGlass(
                in: Capsule(),
                tint: isSelected ? accent : nil,
                interactive: true,
                reduceTransparency: reduceTransparency
            )
        }
        .buttonStyle(DictionaryButtonStyle(reduceMotion: reduceMotion))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .accessibilityLabel(title)
        .help(title)
    }

    private var tokenList: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Directions")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))

                Spacer(minLength: 8)

                Text(model.resultSummary)
                    .font(.system(size: 11, weight: .regular, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 18)
            .padding(.top, 16)
            .padding(.bottom, 10)

            if model.filteredTokens.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(model.filteredTokens) { token in
                            tokenRow(token)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.bottom, 18)
                }
                .scrollIndicators(.hidden)
            }
        }
        .frame(minWidth: 360, idealWidth: 430, maxWidth: 520, maxHeight: .infinity, alignment: .topLeading)
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: "line.3.horizontal.decrease.circle")
                .font(.system(size: 24, weight: .medium))
                .foregroundStyle(accent)

            Text("No matching directions")
                .font(.system(size: 15, weight: .semibold, design: .rounded))

            Text("Try a shorthand, an alias, or a broader tag.")
                .font(.system(size: 12))
                .foregroundStyle(.secondary)

            Button("Clear filters") {
                model.clearFilters()
            }
            .buttonStyle(.link)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(accent)
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }

    private func tokenRow(_ token: PromptToken) -> some View {
        let isSelected = model.selectedTokenID == token.id

        return Button {
            withAnimation(dictionaryAnimation) {
                model.select(token)
            }
        } label: {
            HStack(alignment: .top, spacing: 11) {
                Image(systemName: token.category.iconName)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(isSelected ? Color.black : accent)
                    .frame(width: 29, height: 29)
                    .background(
                        isSelected ? accent : accent.opacity(0.14),
                        in: Circle()
                    )
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text(token.label)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(.primary)
                            .lineLimit(1)

                        if token.source == .user {
                            Text("YOURS")
                                .font(.system(size: 8, weight: .bold, design: .rounded))
                                .tracking(0.45)
                                .foregroundStyle(accent)
                        }
                    }

                    HStack(spacing: 7) {
                        Text(token.shorthand)
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundStyle(isSelected ? accent : .secondary)
                            .lineLimit(1)

                        Text("·")
                            .foregroundStyle(.tertiary)

                        Text(token.category.displayName)
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Text(token.summary)
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 3)

                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.tertiary)
                    .padding(.top, 9)
                    .accessibilityHidden(true)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .dictionaryGlass(
                in: RoundedRectangle(cornerRadius: 14, style: .continuous),
                tint: isSelected ? accent.opacity(0.34) : nil,
                interactive: true,
                reduceTransparency: reduceTransparency
            )
        }
        .buttonStyle(DictionaryButtonStyle(reduceMotion: reduceMotion))
        .accessibilityIdentifier("token-row-\(token.id)")
        .accessibilityLabel("\(token.label), \(token.shorthand)")
        .accessibilityValue("\(token.category.displayName), \(token.source.displayName)")
        .accessibilityHint("Show direction details")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var detailPane: some View {
        Group {
            if let token = model.selectedToken {
                ScrollView {
                    tokenDetails(token)
                }
                .scrollIndicators(.hidden)
            } else {
                VStack(spacing: 10) {
                    Image(systemName: "text.magnifyingglass")
                        .font(.system(size: 24, weight: .medium))
                        .foregroundStyle(.secondary)
                    Text("Select a direction")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                    Text("Its meaning, aliases, tags, and examples will appear here.")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 250)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(.horizontal, 24)
        .padding(.top, 20)
        .padding(.bottom, 24)
        .background(Color.primary.opacity(0.025))
    }

    private func tokenDetails(_ token: PromptToken) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: token.category.iconName)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color.black)
                    .frame(width: 38, height: 38)
                    .background(accent, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 4) {
                    Text(token.label)
                        .font(.system(size: 20, weight: .semibold, design: .rounded))
                        .foregroundStyle(.primary)

                    HStack(spacing: 7) {
                        Text(token.category.displayName)
                        Text("·")
                        Text(token.kind.displayName)
                        Text("·")
                        Text(token.source.displayName)
                    }
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                }

                Spacer(minLength: 4)
            }

            HStack(spacing: 9) {
                Text(token.shorthand)
                    .font(.system(size: 15, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.primary)
                    .textSelection(.enabled)

                Spacer(minLength: 6)

                Button {
                    copy(token)
                } label: {
                    Label(
                        copiedTokenID == token.id ? "Copied" : "Copy shorthand",
                        systemImage: copiedTokenID == token.id ? "checkmark" : "doc.on.doc"
                    )
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 10)
                    .frame(minHeight: 30)
                    .dictionaryGlass(
                        in: Capsule(),
                        tint: copiedTokenID == token.id ? accent.opacity(0.58) : nil,
                        interactive: true,
                        reduceTransparency: reduceTransparency
                    )
                }
                .buttonStyle(DictionaryButtonStyle(reduceMotion: reduceMotion))
                .accessibilityIdentifier("token-copy-\(token.id)")
                .help("Copy shorthand")
            }

            if let onInsert {
                Button {
                    onInsert(token)
                } label: {
                    Label("Use in Cue", systemImage: "arrow.down.to.line.compact")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color.black)
                        .frame(maxWidth: .infinity, minHeight: 34)
                        .dictionaryGlass(
                            in: RoundedRectangle(cornerRadius: 11, style: .continuous),
                            tint: accent,
                            interactive: true,
                            reduceTransparency: reduceTransparency
                        )
                }
                .buttonStyle(DictionaryButtonStyle(reduceMotion: reduceMotion))
                .accessibilityIdentifier("token-use-in-cue-\(token.id)")
                .accessibilityHint("Pass this token to the connected Cue surface")
            }

            Text(onInsert == nil
                ? "Copy places only the shorthand on the local clipboard. Nothing is pasted into another app."
                : "Use in Cue passes the record to the connected surface. Copy remains manual and local.")
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            detailSection(title: "Meaning") {
                Text(token.summary)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let axis = token.axis {
                detailSection(title: "Axis") {
                    metadataValue(axis)
                }
            }

            if !token.aliases.isEmpty {
                detailSection(title: "Aliases") {
                    chipRow(token.aliases, tint: accent.opacity(0.22))
                }
            }

            if !token.tags.isEmpty {
                detailSection(title: "Tags") {
                    chipRow(token.tags, tint: Color.primary.opacity(0.08))
                }
            }

            detailSection(title: token.kind == .preset ? "Expansion" : "Prompt direction") {
                Text(token.expansion)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(.primary)
                    .textSelection(.enabled)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if !token.components.isEmpty {
                detailSection(title: "Components") {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(token.components, id: \.self) { componentID in
                            HStack(spacing: 8) {
                                Image(systemName: "circle.dotted")
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(accent)
                                    .accessibilityHidden(true)

                                if let component = model.allTokens.first(where: { $0.id == componentID }) {
                                    Text(component.label)
                                        .font(.system(size: 12, weight: .medium, design: .rounded))
                                    Text(component.shorthand)
                                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                                        .foregroundStyle(.secondary)
                                } else {
                                    Text(componentID)
                                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }

            if !token.placeholders.isEmpty {
                detailSection(title: "Needs a value") {
                    chipRow(token.placeholders, tint: accent.opacity(0.18))
                }
            }

            if !token.examples.isEmpty {
                detailSection(title: "Examples") {
                    VStack(alignment: .leading, spacing: 13) {
                        ForEach(token.examples) { example in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(example.title)
                                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                                    .foregroundStyle(.secondary)
                                Text(example.prompt)
                                    .font(.system(size: 12, weight: .regular, design: .monospaced))
                                    .foregroundStyle(.primary)
                                    .textSelection(.enabled)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
            }

            if token.source == .user {
                Button(role: .destructive) {
                    removalCandidate = token
                } label: {
                    Label("Remove local addition", systemImage: "trash")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                }
                .buttonStyle(.link)
                .accessibilityIdentifier("token-remove-\(token.id)")
            }
        }
        .frame(maxWidth: 560, alignment: .leading)
    }

    private func detailSection<Content: View>(
        title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .tracking(0.6)

            content()
        }
    }

    private func metadataValue(_ value: String) -> some View {
        Text(value)
            .font(.system(size: 12, weight: .medium, design: .rounded))
            .foregroundStyle(.primary)
    }

    private func chipRow(_ values: [String], tint: Color) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(values, id: \.self) { value in
                    Text(value)
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 8)
                        .frame(minHeight: 24)
                        .dictionaryGlass(
                            in: Capsule(),
                            tint: tint,
                            interactive: false,
                            reduceTransparency: reduceTransparency
                        )
                }
            }
            .padding(.vertical, 1)
        }
        .scrollIndicators(.hidden)
    }

    private func copy(_ token: PromptToken) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(model.copyText(for: token), forType: .string)
        withAnimation(dictionaryAnimation) {
            copiedTokenID = token.id
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
            if copiedTokenID == token.id {
                withAnimation(dictionaryAnimation) {
                    copiedTokenID = nil
                }
            }
        }
    }

    private var dictionaryAnimation: Animation {
        reduceMotion
            ? .easeOut(duration: 0.08)
            : .spring(response: 0.24, dampingFraction: 0.78, blendDuration: 0.08)
    }
}

private struct TokenAdditionDraft {
    var label = ""
    var shorthand = ""
    var category: TokenCategory = .custom
    var aliases = ""
    var tags = ""
    var summary = ""
    var expansion = ""
    var example = ""
}

private struct TokenAdditionSheet: View {
    let onSave: (TokenAdditionDraft) -> String?

    @Environment(\.dismiss) private var dismiss
    @State private var draft = TokenAdditionDraft()
    @State private var validationMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Add token")
                        .font(.system(size: 19, weight: .semibold, design: .rounded))
                    Text("Save a local direction for later browsing and manual copy.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 12)

                Button("Cancel") {
                    dismiss()
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
            }
            .padding(.bottom, 18)

            ScrollView {
                VStack(alignment: .leading, spacing: 13) {
                    formField("Name") {
                        TextField("e.g. Soft daylight", text: $draft.label)
                    }

                    formField("Shorthand") {
                        TextField("e.g. light:window", text: $draft.shorthand)
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                    }

                    formField("Category") {
                        Picker("Category", selection: $draft.category) {
                            ForEach(TokenCategory.browseOrder, id: \.self) { category in
                                Label(category.displayName, systemImage: category.iconName)
                                    .tag(category)
                            }
                        }
                        .labelsHidden()
                        .pickerStyle(.menu)
                    }

                    formField("Aliases") {
                        TextField("Comma-separated alternate spellings", text: $draft.aliases)
                    }

                    formField("Tags") {
                        TextField("Comma-separated search tags", text: $draft.tags)
                    }

                    formField("Summary") {
                        TextField("One sentence that explains the direction", text: $draft.summary)
                    }

                    formField("Prompt direction") {
                        TextEditor(text: $draft.expansion)
                            .font(.system(size: 12))
                            .frame(minHeight: 74)
                            .scrollContentBackground(.hidden)
                            .padding(6)
                            .background(
                                Color.primary.opacity(0.06),
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                            )
                    }

                    formField("Example") {
                        TextEditor(text: $draft.example)
                            .font(.system(size: 12, design: .monospaced))
                            .frame(minHeight: 54)
                            .scrollContentBackground(.hidden)
                            .padding(6)
                            .background(
                                Color.primary.opacity(0.06),
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                            )
                    }

                    if let validationMessage {
                        Label(validationMessage, systemImage: "exclamationmark.triangle")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.orange)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.bottom, 14)
            }
            .scrollIndicators(.hidden)

            Divider()
                .padding(.bottom, 12)

            HStack {
                Text("Aliases and tags are comma-separated.")
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)

                Spacer(minLength: 12)

                Button("Save token") {
                    save()
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(22)
        .frame(width: 470, height: 620)
    }

    private func formField<Content: View>(
        _ title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .tracking(0.6)
            content()
                .textFieldStyle(.roundedBorder)
        }
    }

    private func save() {
        if let message = onSave(draft) {
            validationMessage = message
        } else {
            dismiss()
        }
    }
}

private extension View {
    @ViewBuilder
    func dictionaryGlass<S: Shape>(
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

private struct DictionaryButtonStyle: ButtonStyle {
    let reduceMotion: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.975 : 1)
            .animation(
                reduceMotion
                    ? .easeOut(duration: 0.08)
                    : .spring(response: 0.22, dampingFraction: 0.74, blendDuration: 0.08),
                value: configuration.isPressed
            )
    }
}
