import Foundation

enum GalleryFixtures {
    static var catalog: GalleryCatalog {
        let tags = [
            GalleryTag(id: "family.directed-studio", label: "Directed studio", scope: .family, aliases: ["studio"]),
            GalleryTag(id: "family.directed-location", label: "Directed location", scope: .family, aliases: ["location"]),
            GalleryTag(id: "medium.photography", label: "Photography", scope: .medium, aliases: ["photo"]),
            GalleryTag(id: "medium.identity", label: "Identity", scope: .medium),
            GalleryTag(id: "subject.product", label: "Product", scope: .subject, aliases: ["object"]),
            GalleryTag(id: "subject.brand", label: "Brand", scope: .subject),
            GalleryTag(id: "material.brushed-metal", label: "Brushed metal", scope: .material, aliases: ["metal"]),
            GalleryTag(id: "material.polycarbonate", label: "Frosted polycarbonate", scope: .material, aliases: ["frosted"]),
            GalleryTag(id: "workflow.reusable", label: "Reusable", scope: .workflow, aliases: ["template"]),
            GalleryTag(id: "workflow.reference", label: "Reference", scope: .workflow, aliases: ["source"]),
        ]

        let entries = [
            GalleryEntry(
                id: "direction.signal-product-plate",
                title: "Signal product plate",
                summary: "A controlled studio direction for clean silhouettes, hard edges, and one warm signal light.",
                kind: .direction,
                source: .curated,
                media: .bundledAsset("group-stage-v2"),
                tagIDs: ["family.directed-studio", "medium.photography", "subject.product", "material.brushed-metal", "workflow.reusable"],
                elements: [
                    GalleryElement(id: "element.signal-light", label: "Signal light", detail: "One restrained orange highlight against a charcoal field.", kind: .direction, media: .symbol("light.beacon.max"), tagIDs: ["material.brushed-metal"]),
                    GalleryElement(id: "element.clean-silhouette", label: "Clean silhouette", detail: "A readable object edge with room around the product.", kind: .direction, media: .symbol("square.dashed"), tagIDs: ["subject.product"]),
                ]
            ),
            GalleryEntry(
                id: "direction.quiet-editorial-portrait",
                title: "Quiet editorial portrait",
                summary: "A soft, deliberate portrait direction with a close crop and controlled viewpoint.",
                kind: .direction,
                source: .curated,
                media: .bundledAsset("group-optics-v2"),
                tagIDs: ["family.directed-location", "medium.photography", "workflow.reusable"],
                elements: [
                    GalleryElement(id: "element.close-viewpoint", label: "Close viewpoint", detail: "The camera stays near the subject without turning the frame into a spectacle.", kind: .direction, media: .symbol("viewfinder"), tagIDs: ["medium.photography"]),
                ]
            ),
            GalleryEntry(
                id: "direction.frosted-identity-study",
                title: "Frosted identity study",
                summary: "A tactile brand direction built from translucent surfaces, quiet contrast, and precise spacing.",
                kind: .direction,
                source: .curated,
                media: .bundledAsset("group-finish-v2"),
                tagIDs: ["family.directed-studio", "medium.identity", "subject.brand", "material.polycarbonate", "workflow.reference"],
                elements: [
                    GalleryElement(id: "element.frosted-layer", label: "Frosted layer", detail: "Translucency carries depth without becoming a decorative haze.", kind: .material, media: .symbol("square.3.layers.3d"), tagIDs: ["material.polycarbonate"]),
                ]
            ),
            GalleryEntry(
                id: "user.brand-mark-study",
                title: "Brand mark study",
                summary: "A user-added reference for a compact mark, lockup, or identity detail.",
                kind: .brandAsset,
                source: .userAdded,
                media: .symbol("seal"),
                tagIDs: ["subject.brand", "medium.identity", "workflow.reference"],
                elements: [
                    GalleryElement(id: "user.brand-mark-element", label: "Primary mark", detail: "The preferred mark to keep nearby while composing a direction.", kind: .brandAsset, media: .symbol("seal.fill"), tagIDs: ["subject.brand"]),
                ]
            ),
            GalleryEntry(
                id: "user.travel-bottle",
                title: "Travel bottle",
                summary: "A user-added product reference ready for packaging, material, and silhouette studies.",
                kind: .product,
                source: .userAdded,
                media: .symbol("shippingbox.fill"),
                tagIDs: ["subject.product", "material.brushed-metal", "workflow.reference"],
                elements: [
                    GalleryElement(id: "user.travel-bottle-element", label: "Product body", detail: "Keep the product proportions and finish visible in the reference.", kind: .product, media: .symbol("bottle"), tagIDs: ["subject.product"]),
                ]
            ),
        ]

        do {
            return try GalleryCatalog(tags: tags, entries: entries)
        } catch {
            preconditionFailure("Gallery fixture is invalid: \(error.localizedDescription)")
        }
    }
}
