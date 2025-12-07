const COMMANDS: &[&str] = &["request_eventkit_access"];

use swift_rs::SwiftLinker;

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
    SwiftLinker::new("10.13")
        // Only if you are also targetting iOS
        // Ensure the same minimum supported iOS version is specified as in your `Package.swift` file
        .with_ios("11")
        .with_package("eventkitPlugin", "./swift/.build/debug/")
        .link();
}
