import AppKit
import SwiftUI

private enum NativeShellComposerMode: String, CaseIterable, Identifiable {
    case create
    case edit

    var id: String { rawValue }

    var title: String { rawValue.capitalized }
}

private enum NativeShellGroup: String, CaseIterable, Hashable, Identifiable {
    case optics
    case stage
    case finish

    var id: String { rawValue }

    var title: String { rawValue.capitalized }

    var symbol: String {
        switch self {
        case .optics: "camera.aperture"
        case .stage: "rectangle.3.group"
        case .finish: "circle.lefthalf.filled"
        }
    }

    var assetName: String {
        "group-\(rawValue)-v2"
    }

    var options: [NativeShellSelectorOption] {
        switch self {
        case .optics:
            [
                NativeShellSelectorOption(
                    id: "natural50",
                    title: "Natural 50",
                    detail: "Balanced perspective",
                    symbol: "camera.aperture"
                ),
                NativeShellSelectorOption(
                    id: "film35",
                    title: "35mm Film",
                    detail: "Film character",
                    symbol: "film"
                ),
                NativeShellSelectorOption(
                    id: "wide24",
                    title: "Wide 24",
                    detail: "Broader framing",
                    symbol: "camera.macro"
                ),
            ]
        case .stage:
            [
                NativeShellSelectorOption(
                    id: "centered",
                    title: "Centered",
                    detail: "Balanced frame",
                    symbol: "square.grid.3x3"
                ),
                NativeShellSelectorOption(
                    id: "portrait",
                    title: "Portrait frame",
                    detail: "Subject-led framing",
                    symbol: "rectangle.portrait"
                ),
                NativeShellSelectorOption(
                    id: "negativeSpace",
                    title: "Negative space",
                    detail: "Air around the subject",
                    symbol: "rectangle.dashed"
                ),
                NativeShellSelectorOption(
                    id: "closeCrop",
                    title: "Close crop",
                    detail: "Tight framing",
                    symbol: "viewfinder"
                ),
                NativeShellSelectorOption(
                    id: "wideScene",
                    title: "Wide scene",
                    detail: "Environment-led framing",
                    symbol: "rectangle.expand.vertical"
                ),
                NativeShellSelectorOption(
                    id: "overhead",
                    title: "Overhead",
                    detail: "Top-down frame",
                    symbol: "arrow.down.to.line"
                ),
                NativeShellSelectorOption(
                    id: "lowAngle",
                    title: "Low angle",
                    detail: "Grounded frame",
                    symbol: "arrow.up.to.line"
                ),
                NativeShellSelectorOption(
                    id: "detail",
                    title: "Detail",
                    detail: "Element-led frame",
                    symbol: "viewfinder.circle"
                ),
            ]
        case .finish:
            [
                NativeShellSelectorOption(
                    id: "neutral",
                    title: "Neutral",
                    detail: "Natural grade",
                    symbol: "circle.lefthalf.filled"
                ),
                NativeShellSelectorOption(
                    id: "contrast",
                    title: "Contrast",
                    detail: "Harder separation",
                    symbol: "circle.lefthalf.striped.horizontal"
                ),
                NativeShellSelectorOption(
                    id: "mono",
                    title: "Monochrome",
                    detail: "Single-channel grade",
                    symbol: "circle.righthalf.filled"
                ),
                NativeShellSelectorOption(
                    id: "warm",
                    title: "Warm",
                    detail: "Amber bias",
                    symbol: "sun.max"
                ),
                NativeShellSelectorOption(
                    id: "cool",
                    title: "Cool",
                    detail: "Blue bias",
                    symbol: "snowflake"
                ),
                NativeShellSelectorOption(
                    id: "matte",
                    title: "Matte",
                    detail: "Soft highlights",
                    symbol: "circle.dashed"
                ),
                NativeShellSelectorOption(
                    id: "bleach",
                    title: "Bleach",
                    detail: "Muted color",
                    symbol: "drop.halffull"
                ),
                NativeShellSelectorOption(
                    id: "neon",
                    title: "Neon",
                    detail: "Luminous color",
                    symbol: "lightbulb"
                ),
            ]
        }
    }
}

private struct NativeShellSelectorOption: Identifiable, Hashable {
    let id: String
    let title: String
    let detail: String
    let symbol: String
}

private struct NativeShellCueDraft {
    var mode: NativeShellComposerMode = .create
    var text = ""
    var ratio = "4:5"
    var resolution = "2K"
    var selections: [NativeShellGroup: String] = [
        .optics: "natural50",
        .stage: "centered",
        .finish: "neutral",
    ]
    var referenceCount = 0
}

private enum NativeShellSheet: Identifiable {
    case selector(NativeShellGroup)
    case preview

    var id: String {
        switch self {
        case let .selector(group): "selector-\(group.rawValue)"
        case .preview: "preview"
        }
    }
}

struct NativeShellCueSurface: View {
    @State private var draft = NativeShellCueDraft()
    @State private var presentedSheet: NativeShellSheet?
    @State private var lastAction = ""
    @FocusState private var promptFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            modePicker

            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 16) {
                    promptEditor
                    groupControls
                    outputControls
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                actionColumn
            }
        }
        .padding(26)
        .frame(width: 860, height: 620, alignment: .topLeading)
        .background(Color(nsColor: .windowBackgroundColor))
        .sheet(item: $presentedSheet) { sheet in
            switch sheet {
            case let .selector(group):
                NativeShellSelectorSheet(
                    group: group,
                    selections: $draft.selections
                )
            case .preview:
                NativeShellPreviewSheet(text: draft.text)
            }
        }
        .accessibilityIdentifier("native-shell-cue-surface")
    }

    private var modePicker: some View {
        Picker("Mode", selection: $draft.mode) {
            ForEach(NativeShellComposerMode.allCases) { mode in
                Text(mode.title).tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .controlSize(.small)
        .frame(width: 184)
        .accessibilityIdentifier("native-shell-mode")
    }

    private var promptEditor: some View {
        ZStack(alignment: .topLeading) {
            if draft.text.isEmpty {
                Text("Describe the subject, action, and scene")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 9)
                    .allowsHitTesting(false)
            }

            TextEditor(text: $draft.text)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .scrollContentBackground(.hidden)
                .focused($promptFocused)
                .padding(3)
        }
        .frame(maxWidth: .infinity, minHeight: 168, maxHeight: 168)
        .nativeShellSurface(
            in: RoundedRectangle(cornerRadius: 16, style: .continuous),
            tint: promptFocused ? .orange.opacity(0.18) : nil
        )
        .accessibilityIdentifier("native-shell-prompt")
        .accessibilityLabel("Prompt")
    }

    private var groupControls: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 3),
            spacing: 12
        ) {
            ForEach(NativeShellGroup.allCases) { group in
                Button {
                    presentedSheet = .selector(group)
                } label: {
                    groupButtonLabel(group)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("native-shell-group-\(group.rawValue)")
                .accessibilityHint("Open \(group.title) choices")
            }
        }
    }

    private func groupButtonLabel(_ group: NativeShellGroup) -> some View {
        let selectionID = draft.selections[group] ?? ""
        let selection = group.options.first(where: { $0.id == selectionID })

        return HStack(spacing: 10) {
            groupImage(group)
                .frame(width: 42, height: 42)
                .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(group.title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .lineLimit(1)

                Text(selection?.title ?? "Choose")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)

            Image(systemName: "chevron.up.chevron.down")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.secondary)
        }
        .padding(10)
        .frame(maxWidth: .infinity, minHeight: 66, alignment: .leading)
        .nativeShellSurface(
            in: RoundedRectangle(cornerRadius: 15, style: .continuous),
            tint: nil
        )
    }

    private var outputControls: some View {
        HStack(spacing: 9) {
            Menu {
                ForEach(["1:1", "4:5", "16:9"], id: \.self) { ratio in
                    Button(ratio) { draft.ratio = ratio }
                }
            } label: {
                Label(draft.ratio, systemImage: "aspectratio")
            }
            .accessibilityIdentifier("native-shell-ratio")

            Menu {
                ForEach(["1K", "2K", "4K"], id: \.self) { resolution in
                    Button(resolution) { draft.resolution = resolution }
                }
            } label: {
                Label(draft.resolution, systemImage: "4k.tv")
            }
            .accessibilityIdentifier("native-shell-resolution")

            Button {
                draft.referenceCount += 1
                lastAction = draft.referenceCount == 1
                    ? "Reference slot added"
                    : "\(draft.referenceCount) reference slots added"
            } label: {
                Label(
                    draft.referenceCount == 0 ? "Reference" : "Reference \(draft.referenceCount)",
                    systemImage: "photo.badge.plus"
                )
            }
            .accessibilityIdentifier("native-shell-reference")

            Spacer(minLength: 0)
        }
        .buttonStyle(.borderless)
        .controlSize(.small)
    }

    private var actionColumn: some View {
        VStack(spacing: 10) {
            Button {
                lastAction = draft.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    ? "Add prompt text before applying"
                    : "Draft ready"
            } label: {
                VStack(spacing: 7) {
                    Image(systemName: "arrow.up.forward")
                        .font(.system(size: 23, weight: .bold))

                    Text("Apply")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                }
                .foregroundStyle(Color.black)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.orange, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(.plain)
            .frame(width: 98, height: 128)
            .accessibilityIdentifier("native-shell-apply")

            Button {
                presentedSheet = .preview
            } label: {
                Label("Preview", systemImage: "eye")
                    .labelStyle(.iconOnly)
                    .font(.system(size: 15, weight: .semibold))
                    .frame(width: 98, height: 38)
            }
            .buttonStyle(.borderless)
            .nativeShellSurface(
                in: RoundedRectangle(cornerRadius: 12, style: .continuous),
                tint: nil
            )
            .accessibilityIdentifier("native-shell-preview")
            .accessibilityLabel("Preview")

            if !lastAction.isEmpty {
                Text(lastAction)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .frame(width: 98)
                    .accessibilityIdentifier("native-shell-status")
            }

            Spacer(minLength: 0)
        }
        .frame(width: 98, alignment: .top)
    }

    @ViewBuilder
    private func groupImage(_ group: NativeShellGroup) -> some View {
        if let path = Bundle.main.path(forResource: group.assetName, ofType: "png"),
           let image = NSImage(contentsOfFile: path) {
            Image(nsImage: image)
                .resizable()
                .scaledToFit()
        } else {
            Image(systemName: group.symbol)
                .font(.system(size: 20, weight: .medium))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

private struct NativeShellSelectorSheet: View {
    let group: NativeShellGroup
    @Binding var selections: [NativeShellGroup: String]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(group.title)
                        .font(.system(size: 21, weight: .bold, design: .rounded))

                    Text("Choose a direction")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 0)

                Button("Done") { dismiss() }
                    .keyboardShortcut(.defaultAction)
            }

            ScrollView {
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 158), spacing: 12)],
                    spacing: 12
                ) {
                    ForEach(group.options) { option in
                        optionButton(option)
                    }
                }
            }
        }
        .padding(24)
        .frame(minWidth: 570, idealWidth: 620, minHeight: 400, idealHeight: 470)
        .background(Color(nsColor: .windowBackgroundColor))
        .accessibilityIdentifier("native-shell-selector-\(group.rawValue)")
    }

    private func optionButton(_ option: NativeShellSelectorOption) -> some View {
        let isSelected = selections[group] == option.id

        return Button {
            selections[group] = option.id
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: option.symbol)
                        .font(.system(size: 21, weight: .medium))
                        .frame(width: 38, height: 38)
                        .foregroundStyle(isSelected ? Color.orange : Color.primary)

                    Spacer(minLength: 0)

                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.orange)
                    }
                }

                Text(option.title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .lineLimit(1)

                Text(option.detail)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            .padding(13)
            .frame(maxWidth: .infinity, minHeight: 116, alignment: .leading)
            .nativeShellSurface(
                in: RoundedRectangle(cornerRadius: 14, style: .continuous),
                tint: isSelected ? .orange.opacity(0.18) : nil
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("native-shell-option-\(group.rawValue)-\(option.id)")
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }
}

private struct NativeShellPreviewSheet: View {
    let text: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Preview")
                    .font(.system(size: 21, weight: .bold, design: .rounded))

                Spacer(minLength: 0)

                Button("Done") { dismiss() }
                    .keyboardShortcut(.defaultAction)
            }

            ScrollView {
                Text(text.isEmpty ? "Add prompt text to see it here." : text)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
                    .padding(14)
                    .nativeShellSurface(
                        in: RoundedRectangle(cornerRadius: 13, style: .continuous),
                        tint: nil
                    )
            }
        }
        .padding(24)
        .frame(minWidth: 520, idealWidth: 620, minHeight: 320, idealHeight: 390)
        .background(Color(nsColor: .windowBackgroundColor))
        .accessibilityIdentifier("native-shell-preview-sheet")
    }
}

private extension View {
    func nativeShellSurface<S: Shape>(in shape: S, tint: Color?) -> some View {
        modifier(NativeShellSurfaceModifier(shape: shape, tint: tint))
    }
}

private struct NativeShellSurfaceModifier<S: Shape>: ViewModifier {
    let shape: S
    let tint: Color?
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    @ViewBuilder
    func body(content: Content) -> some View {
        if reduceTransparency {
            content
                .background(Color(nsColor: .controlBackgroundColor), in: shape)
                .overlay(shape.stroke(Color(nsColor: .separatorColor).opacity(0.72), lineWidth: 1))
        } else {
            content
                .background(.regularMaterial, in: shape)
                .overlay {
                    if let tint {
                        shape.fill(tint)
                    }
                }
                .overlay(shape.stroke(Color(nsColor: .separatorColor).opacity(0.48), lineWidth: 1))
        }
    }
}
