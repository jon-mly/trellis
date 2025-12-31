use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeResponse {
    pub content: String,
    pub error: Option<String>,
    pub cli_not_found: bool,
}

#[tauri::command]
async fn send_to_claude(
    prompt: String,
    system_prompt: Option<String>,
) -> Result<ClaudeResponse, String> {
    log::info!("Sending message to Claude CLI");

    // Build the full prompt with system context if provided
    let full_prompt: String = match system_prompt {
        Some(sys) => format!("{}\n\nUser: {}", sys, prompt),
        None => prompt,
    };

    // Run claude CLI with the prompt
    let spawn_result: Result<tokio::process::Child, std::io::Error> = Command::new("claude")
        .arg("-p")
        .arg(&full_prompt)
        .arg("--output-format")
        .arg("text")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn();

    let mut child: tokio::process::Child = match spawn_result {
        Ok(c) => c,
        Err(e) => {
            log::error!("Failed to spawn claude process: {}", e);
            // Check if it's a "not found" error
            let cli_not_found: bool = e.kind() == std::io::ErrorKind::NotFound;
            return Ok(ClaudeResponse {
                content: String::new(),
                error: Some(format!("Failed to spawn claude process: {}", e)),
                cli_not_found,
            });
        }
    };

    let stdout: tokio::process::ChildStdout = child
        .stdout
        .take()
        .ok_or_else(|| -> String { "Failed to capture stdout".to_string() })?;

    let stderr: tokio::process::ChildStderr = child
        .stderr
        .take()
        .ok_or_else(|| -> String { "Failed to capture stderr".to_string() })?;

    // Read output
    let mut stdout_reader: BufReader<tokio::process::ChildStdout> = BufReader::new(stdout);
    let mut stderr_reader: BufReader<tokio::process::ChildStderr> = BufReader::new(stderr);

    let mut content: String = String::new();
    let mut error_output: String = String::new();

    let mut stdout_line: String = String::new();
    while stdout_reader
        .read_line(&mut stdout_line)
        .await
        .unwrap_or(0)
        > 0
    {
        content.push_str(&stdout_line);
        stdout_line.clear();
    }

    let mut stderr_line: String = String::new();
    while stderr_reader
        .read_line(&mut stderr_line)
        .await
        .unwrap_or(0)
        > 0
    {
        error_output.push_str(&stderr_line);
        stderr_line.clear();
    }

    let status: std::process::ExitStatus = child.wait().await.map_err(|e: std::io::Error| -> String {
        log::error!("Failed to wait for claude process: {}", e);
        format!("Failed to wait for claude process: {}", e)
    })?;

    if !status.success() && content.is_empty() {
        log::warn!("Claude CLI exited with error: {}", error_output);
        return Ok(ClaudeResponse {
            content: String::new(),
            error: Some(if error_output.is_empty() {
                "Claude CLI exited with an error".to_string()
            } else {
                error_output.trim().to_string()
            }),
            cli_not_found: false,
        });
    }

    log::info!("Claude response received successfully");

    Ok(ClaudeResponse {
        content: content.trim().to_string(),
        error: if error_output.is_empty() {
            None
        } else {
            Some(error_output.trim().to_string())
        },
        cli_not_found: false,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app: &mut tauri::App| -> Result<(), Box<dyn std::error::Error>> {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Debug)
                    .build(),
            )?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![send_to_claude])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
