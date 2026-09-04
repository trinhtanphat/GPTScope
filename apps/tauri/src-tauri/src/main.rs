#[cfg(any(target_os = "windows", target_os = "macos"))]
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running GPTScope Tauri");
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn main() {
    eprintln!("GPTScope Tauri desktop is packaged for Windows and macOS.");
}
