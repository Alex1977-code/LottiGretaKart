import Foundation
import Capacitor
import MultipeerConnectivity

/// Mehrspieler in der Nähe: iPhones und iPads verbinden sich direkt miteinander (Bluetooth und WLAN von Gerät
/// zu Gerät über Apples MultipeerConnectivity) – ohne Internet, ohne Router, auch im Flugmodus, solange WLAN und
/// Bluetooth eingeschaltet sind.
///
/// Gastgeber: host({ name }) macht das Spiel sichtbar und nimmt Gäste automatisch an.
/// Gast:      browse({ name }) sucht Spiele (Ereignisse peerFound/peerLost), join({ id }) tritt bei.
/// Beide:     send({ to, data }) schickt Text (JSON) an einen Partner, stop() beendet alles.
/// Ereignisse: peerFound { id, name } · peerLost { id } · connected { id, name } · disconnected { id }
///             message { id, data } · error { message }
@objc(LGKNearbyPlugin)
public class LGKNearbyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LGKNearbyPlugin"
    public let jsName = "LGKNearby"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "host", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "browse", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "join", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "send", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    /// Bonjour-Dienst (muss zu NSBonjourServices in der Info.plist passen: _lgkart._tcp und _lgkart._udp)
    private static let serviceType = "lgkart"
    /// MultipeerConnectivity erlaubt bis zu 8 Geräte je Sitzung
    private static let maxGuests = 7

    // Alles hier wird nur auf dem Hauptthread verändert.
    private var session: MCSession?
    private var advertiser: MCNearbyServiceAdvertiser?
    private var browser: MCNearbyServiceBrowser?
    private var idOf: [MCPeerID: String] = [:]
    private var peerOf: [String: MCPeerID] = [:]

    // MARK: - Aufrufe aus JavaScript

    @objc func host(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? "Lotti & Greta Kart"
        DispatchQueue.main.async {
            self.reset()
            let me = MCPeerID(displayName: Self.shortName(name))
            let s = MCSession(peer: me, securityIdentity: nil, encryptionPreference: .required)
            s.delegate = self
            self.session = s
            let adv = MCNearbyServiceAdvertiser(peer: me, discoveryInfo: ["app": "lgkart", "v": "1"], serviceType: Self.serviceType)
            adv.delegate = self
            adv.startAdvertisingPeer()
            self.advertiser = adv
            call.resolve()
        }
    }

    @objc func browse(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? "Gast"
        DispatchQueue.main.async {
            self.reset()
            let me = MCPeerID(displayName: Self.shortName(name))
            let s = MCSession(peer: me, securityIdentity: nil, encryptionPreference: .required)
            s.delegate = self
            self.session = s
            let b = MCNearbyServiceBrowser(peer: me, serviceType: Self.serviceType)
            b.delegate = self
            b.startBrowsingForPeers()
            self.browser = b
            call.resolve()
        }
    }

    @objc func join(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("id fehlt"); return }
        DispatchQueue.main.async {
            guard let peer = self.peerOf[id], let b = self.browser, let s = self.session else {
                call.reject("Dieses Spiel ist nicht mehr da")
                return
            }
            b.invitePeer(peer, to: s, withContext: nil, timeout: 20)
            call.resolve()
        }
    }

    @objc func send(_ call: CAPPluginCall) {
        let text = call.getString("data") ?? ""
        let to = call.getString("to")
        DispatchQueue.main.async {
            guard let s = self.session else { call.resolve(); return }
            var targets = s.connectedPeers
            if let to = to {
                targets = targets.filter { self.idOf[$0] == to }
            }
            if targets.isEmpty { call.resolve(); return }
            do {
                try s.send(Data(text.utf8), toPeers: targets, with: .reliable)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.reset()
            call.resolve()
        }
    }

    // MARK: - Hilfen

    private func reset() {
        advertiser?.stopAdvertisingPeer()
        advertiser?.delegate = nil
        advertiser = nil
        browser?.stopBrowsingForPeers()
        browser?.delegate = nil
        browser = nil
        session?.disconnect()
        session?.delegate = nil
        session = nil
        idOf.removeAll()
        peerOf.removeAll()
    }

    /// Feste Kennung je Partner-Gerät (für JavaScript).
    private func key(_ peer: MCPeerID) -> String {
        if let id = idOf[peer] { return id }
        let id = UUID().uuidString
        idOf[peer] = id
        peerOf[id] = peer
        return id
    }

    /// Anzeigename: höchstens 63 Byte UTF-8 (Vorgabe von MCPeerID).
    private static func shortName(_ name: String) -> String {
        var out = ""
        for ch in name {
            if (out + String(ch)).utf8.count > 63 { break }
            out.append(ch)
        }
        return out.isEmpty ? "Spieler" : out
    }

    private func emit(_ event: String, _ data: [String: Any]) {
        notifyListeners(event, data: data)
    }
}

// MARK: - Sitzung

extension LGKNearbyPlugin: MCSessionDelegate {
    public func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        DispatchQueue.main.async {
            guard session === self.session else { return }
            let id = self.key(peerID)
            switch state {
            case .connected:
                // Gast: verbunden – nicht mehr weitersuchen (spart Funk)
                self.browser?.stopBrowsingForPeers()
                self.emit("connected", ["id": id, "name": peerID.displayName])
            case .notConnected:
                self.emit("disconnected", ["id": id])
            case .connecting:
                break
            @unknown default:
                break
            }
        }
    }

    public func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        guard let text = String(data: data, encoding: .utf8) else { return }
        DispatchQueue.main.async {
            guard session === self.session else { return }
            self.emit("message", ["id": self.key(peerID), "data": text])
        }
    }

    public func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}

    public func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}

    public func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

// MARK: - Gastgeber: sichtbar sein, Gäste annehmen

extension LGKNearbyPlugin: MCNearbyServiceAdvertiserDelegate {
    public func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        DispatchQueue.main.async {
            guard advertiser === self.advertiser, let s = self.session, s.connectedPeers.count < Self.maxGuests else {
                invitationHandler(false, nil)
                return
            }
            invitationHandler(true, s)
        }
    }

    public func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
        DispatchQueue.main.async {
            self.emit("error", ["message": "Spiel nicht sichtbar: \(error.localizedDescription)"])
        }
    }
}

// MARK: - Gast: Spiele in der Nähe finden

extension LGKNearbyPlugin: MCNearbyServiceBrowserDelegate {
    public func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        guard info?["app"] == "lgkart" else { return }
        DispatchQueue.main.async {
            guard browser === self.browser else { return }
            self.emit("peerFound", ["id": self.key(peerID), "name": peerID.displayName])
        }
    }

    public func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        DispatchQueue.main.async {
            guard browser === self.browser, let id = self.idOf[peerID] else { return }
            self.emit("peerLost", ["id": id])
        }
    }

    public func browser(_ browser: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) {
        DispatchQueue.main.async {
            self.emit("error", ["message": "Suche nicht möglich: \(error.localizedDescription)"])
        }
    }
}
