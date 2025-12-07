// The Swift Programming Language
// https://docs.swift.org/swift-book

import EventKit
import SwiftUI

@available(macOS 14, *)
@_cdecl("request_eventkit_access")
public func requestEventKitAccess() {
    let store = EKEventStore()
    print(store.description)
    store.requestWriteOnlyAccessToEvents {
        granted, error in
        if granted {
            print("Access Granted!")
        } else {
            print("Access Denied!")
        }
    }
}
