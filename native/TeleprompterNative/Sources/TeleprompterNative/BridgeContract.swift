import Foundation

struct NativeBootstrap: Codable, Sendable {
    let productName: String
    let libraryVersion: String
    let acceptedRecordCount: Int
    let activeMode: String
    let draftRevision: Int
}

struct NativeCueCommand: Codable, Sendable {
    let type: String
    let expectedRevision: Int
    let value: String
}

struct NativePreview: Codable, Sendable {
    let draftRevision: Int
    let format: String
    let text: String
}

protocol NativeRuntimeBridge: Sendable {
    func bootstrap() -> NativeBootstrap
    func apply(_ command: NativeCueCommand) -> NativeBootstrap
    func preview() -> NativePreview
}

/// Development-only fallback used when the packaged helper cannot be located.
/// The native surface never owns compiler or draft semantics.
struct DevelopmentFixtureBridge: NativeRuntimeBridge {
    func bootstrap() -> NativeBootstrap {
        NativeBootstrap(
            productName: "Teleprompter",
            libraryVersion: "teleprompter-v2",
            acceptedRecordCount: 14,
            activeMode: "create",
            draftRevision: 0
        )
    }

    func apply(_ command: NativeCueCommand) -> NativeBootstrap {
        var state = bootstrap()
        if command.expectedRevision == state.draftRevision {
            state = NativeBootstrap(
                productName: state.productName,
                libraryVersion: state.libraryVersion,
                acceptedRecordCount: state.acceptedRecordCount,
                activeMode: state.activeMode,
                draftRevision: state.draftRevision + 1
            )
        }
        return state
    }

    func preview() -> NativePreview {
        NativePreview(
            draftRevision: 0,
            format: "expanded",
            text: "WHAT:\n[subject + action + scene]\n\nCAM:\n[camera / lens / depth / focus]\n"
        )
    }
}

/// Small synchronous client for the versioned helper contract.
/// The helper is launched with inherited pipes only; no socket, shell, or
/// second compiler is introduced.
final class NativeHelperBridge: @unchecked Sendable, NativeRuntimeBridge {
    private static let maxFrameBytes = 1_000_000
    private static let operations = [
        "hello", "capabilities", "bootstrap", "submit-command", "exact-preview", "flush", "shutdown",
    ]

    private let lock = NSLock()
    private let process: Process
    private let input: FileHandle
    private let output: FileHandle
    private let clientId: String
    private var helperSessionId = ""
    private var contentVersion = ""
    private var acceptedRecordCount = 0
    private var requestNumber = 0
    private var closed = false
    private var current = NativeBootstrap(
        productName: "Teleprompter",
        libraryVersion: "unavailable",
        acceptedRecordCount: 0,
        activeMode: "create",
        draftRevision: 0
    )

    static func make(profile: NativeHelperProfile = .fromEnvironment) -> NativeHelperBridge? {
        do {
            return try NativeHelperBridge(profile: profile)
        } catch {
            fputs("Teleprompter helper unavailable: \(error.localizedDescription)\n", stderr)
            return nil
        }
    }

    private init(profile: NativeHelperProfile) throws {
        let helperPath = try Self.resolveHelperPath()
        let nodePath = try Self.resolveNodePath()
        let toHelper = Pipe()
        let fromHelper = Pipe()

        process = Process()
        process.executableURL = URL(fileURLWithPath: nodePath)
        process.arguments = [helperPath]
        process.standardInput = toHelper
        process.standardOutput = fromHelper
        process.standardError = FileHandle.standardError
        var childEnvironment = ProcessInfo.processInfo.environment
        childEnvironment["TELEPROMPTER_PERSISTENCE_PROFILE"] = profile.rawValue
        if let persistencePath = Self.persistencePath(for: profile) {
            childEnvironment["TELEPROMPTER_PERSISTENCE_PATH"] = persistencePath
        } else {
            childEnvironment.removeValue(forKey: "TELEPROMPTER_PERSISTENCE_PATH")
        }
        process.environment = childEnvironment
        input = toHelper.fileHandleForWriting
        output = fromHelper.fileHandleForReading
        clientId = "native-\(UUID().uuidString.lowercased())"

        try process.run()
        try withLock {
            let hello = try requestUnlocked(
                operation: "hello",
                payload: [
                    "clientVersion": "teleprompter-native-macos",
                    "profileId": "native-\(profile.rawValue)",
                    "profileKind": "disposable",
                    "requestedCapabilities": Self.operations,
                ],
                helperSession: ""
            )
            guard let helloPayload = hello["payload"] as? [String: Any],
                  let issuedSession = helloPayload["helperSessionId"] as? String,
                  !issuedSession.isEmpty else {
                throw NativeBridgeError.protocolViolation("The helper did not issue a session ID.")
            }
            helperSessionId = issuedSession

            let capabilities = try requestUnlocked(operation: "capabilities", payload: [:])
            if let payload = capabilities["payload"] as? [String: Any] {
                contentVersion = payload["contentVersion"] as? String ?? "unknown"
                acceptedRecordCount = (payload["acceptedRecordIds"] as? [Any])?.count ?? 0
            }

            let bootstrap = try requestUnlocked(operation: "bootstrap", payload: [:])
            current = try Self.bootstrap(from: bootstrap, contentVersion: contentVersion, acceptedRecordCount: acceptedRecordCount)
        }
    }

    deinit {
        lock.lock()
        if !closed && process.isRunning && !helperSessionId.isEmpty {
            try? _ = requestUnlocked(operation: "shutdown", payload: ["reason": "host-exit"])
            closed = true
        }
        lock.unlock()
        if process.isRunning { process.terminate() }
    }

    func bootstrap() -> NativeBootstrap {
        lock.lock()
        defer { lock.unlock() }
        return current
    }

    func apply(_ command: NativeCueCommand) -> NativeBootstrap {
        lock.lock()
        defer { lock.unlock() }
        guard !closed else { return current }
        do {
            let response = try requestUnlocked(
                operation: "submit-command",
                payload: [
                    "command": [
                        "commandId": "cmd-\(UUID().uuidString.lowercased())",
                        "clientId": clientId,
                        "draftId": "create",
                        "expectedFieldRevisions": ["what": command.expectedRevision],
                        "command": ["type": command.type, "text": command.value],
                    ],
                ]
            )
            guard let result = response["payload"] as? [String: Any],
                  result["ok"] as? Bool == true,
                  let value = result["value"] as? [String: Any],
                  let snapshot = value["snapshot"] as? [String: Any] else {
                return current
            }
            current = try Self.bootstrapFromSnapshot(snapshot, contentVersion: contentVersion, acceptedRecordCount: acceptedRecordCount)
        } catch {
            fputs("Teleprompter apply failed: \(error.localizedDescription)\n", stderr)
        }
        return current
    }

    func preview() -> NativePreview {
        lock.lock()
        defer { lock.unlock() }
        guard !closed else { return NativePreview(draftRevision: current.draftRevision, format: "expanded", text: "Preview unavailable: helper stopped") }
        do {
            let requestId = "preview-\(UUID().uuidString.lowercased())"
            let response = try requestUnlocked(
                operation: "exact-preview",
                payload: [
                    "request": [
                        "requestId": requestId,
                        "draftId": "create",
                        "expectedRevision": current.draftRevision,
                        "format": "expanded",
                        "expectedContentVersion": contentVersion,
                    ],
                ],
                requestId: requestId
            )
            guard let payload = response["payload"] as? [String: Any],
                  let revision = payload["revision"] as? Int,
                  let format = payload["format"] as? String,
                  let text = payload["text"] as? String else {
                throw NativeBridgeError.protocolViolation("The helper returned an invalid preview payload.")
            }
            return NativePreview(draftRevision: revision, format: format, text: text)
        } catch {
            return NativePreview(draftRevision: current.draftRevision, format: "expanded", text: "Preview unavailable: \(error.localizedDescription)")
        }
    }

    private func requestUnlocked(operation: String, payload: [String: Any], helperSession: String? = nil, requestId: String? = nil) throws -> [String: Any] {
        guard !closed else { throw NativeBridgeError.unavailable("The helper has already stopped.") }
        requestNumber += 1
        let id = requestId ?? "req-\(requestNumber)-\(UUID().uuidString.lowercased())"
        let frame: [String: Any] = [
            "protocolVersion": 1,
            "kind": "request",
            "clientId": clientId,
            "helperSessionId": helperSession ?? helperSessionId,
            "requestId": id,
            "operation": operation,
            "payload": payload,
        ]
        let data = try JSONSerialization.data(withJSONObject: frame, options: []) + Data([0x0A])
        try input.write(contentsOf: data)
        while true {
            let response = try readFrame()
            if response["kind"] as? String == "event" {
                // Mutations emit an authoritative snapshot after their response. Consume it
                // so it cannot be mistaken for the next request's response.
                continue
            }
            guard response["operation"] as? String == operation,
                  response["requestId"] as? String == id else {
                throw NativeBridgeError.protocolViolation("The helper response identity did not match the request.")
            }
            if response["ok"] as? Bool == false {
                let error = response["error"] as? [String: Any]
                throw NativeBridgeError.remote(
                    code: error?["code"] as? String ?? "INTERNAL",
                    message: error?["message"] as? String ?? "The helper rejected the request."
                )
            }
            return response
        }
    }

    private func readFrame() throws -> [String: Any] {
        var data = Data()
        while true {
            let chunk = output.readData(ofLength: 1)
            if chunk.isEmpty { throw NativeBridgeError.eof }
            data.append(chunk)
            if data.count > Self.maxFrameBytes { throw NativeBridgeError.protocolViolation("The helper frame exceeded the byte limit.") }
            if chunk.last == 0x0A { break }
        }
        let value = try JSONSerialization.jsonObject(with: data, options: [])
        guard let frame = value as? [String: Any] else { throw NativeBridgeError.protocolViolation("The helper returned a non-object frame.") }
        return frame
    }

    private static func bootstrap(from response: [String: Any], contentVersion: String, acceptedRecordCount: Int) throws -> NativeBootstrap {
        guard let payload = response["payload"] as? [String: Any],
              let snapshot = payload["snapshot"] as? [String: Any] else {
            throw NativeBridgeError.protocolViolation("The helper returned an invalid bootstrap payload.")
        }
        return try bootstrapFromSnapshot(snapshot, contentVersion: contentVersion, acceptedRecordCount: acceptedRecordCount)
    }

    private static func bootstrapFromSnapshot(_ snapshot: [String: Any], contentVersion: String, acceptedRecordCount: Int) throws -> NativeBootstrap {
        guard let activeMode = snapshot["activeMode"] as? String,
              let drafts = snapshot["drafts"] as? [String: Any],
              let createDraft = drafts["create"] as? [String: Any],
              let revision = createDraft["revision"] as? Int else {
            throw NativeBridgeError.protocolViolation("The helper returned an invalid draft snapshot.")
        }
        return NativeBootstrap(productName: "Teleprompter", libraryVersion: contentVersion, acceptedRecordCount: acceptedRecordCount, activeMode: activeMode, draftRevision: revision)
    }

    private static func resolveHelperPath() throws -> String {
        let environment = ProcessInfo.processInfo.environment
        let candidates = [
            environment["TELEPROMPTER_HELPER_PATH"],
            Bundle.main.path(forResource: "teleprompter-helper", ofType: "js"),
            FileManager.default.currentDirectoryPath + "/out/helper/teleprompter-helper.js",
        ].compactMap { $0 }
        if let path = candidates.first(where: { FileManager.default.isReadableFile(atPath: $0) }) { return path }
        throw NativeBridgeError.unavailable("Set TELEPROMPTER_HELPER_PATH or package the helper with the app.")
    }

    private static func persistencePath(for profile: NativeHelperProfile) -> String? {
        guard profile == .durable else { return nil }
        if let override = ProcessInfo.processInfo.environment["TELEPROMPTER_PERSISTENCE_PATH"], !override.isEmpty {
            return override
        }
        return canonicalDraftStorePath.path
    }

    private static var canonicalDraftStorePath: URL {
        let applicationSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return applicationSupport
            .appendingPathComponent("teleprompter", isDirectory: true)
            .appendingPathComponent("cue-drafts.json", isDirectory: false)
    }

    private static func resolveNodePath() throws -> String {
        let environment = ProcessInfo.processInfo.environment
        let pathCandidates = environment["PATH"]?.split(separator: ":").map { "\($0)/node" } ?? []
        let candidates = [environment["TELEPROMPTER_NODE_PATH"], "/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node"]
            .compactMap { $0 } + pathCandidates
        if let path = candidates.first(where: { FileManager.default.isExecutableFile(atPath: $0) }) { return path }
        throw NativeBridgeError.unavailable("Set TELEPROMPTER_NODE_PATH to the bundled Node executable.")
    }

    private func withLock<T>(_ body: () throws -> T) rethrows -> T {
        lock.lock()
        defer { lock.unlock() }
        return try body()
    }
}

enum NativeHelperProfile: String {
    case disposable
    case durable

    static var fromEnvironment: NativeHelperProfile {
        ProcessInfo.processInfo.environment["TELEPROMPTER_PERSISTENCE_PROFILE"] == "durable" ? .durable : .disposable
    }
}

private enum NativeBridgeError: Error, LocalizedError {
    case unavailable(String)
    case eof
    case protocolViolation(String)
    case remote(code: String, message: String)

    var errorDescription: String? {
        switch self {
        case let .unavailable(message), let .protocolViolation(message): message
        case .eof: "The helper closed its JSON-lines stream."
        case let .remote(code, message): "\(code): \(message)"
        }
    }
}
