use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::time::timeout;

const CLI_TIMEOUT_SECS: u64 = 10;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeResponse {
    pub content: String,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthStatus {
    pub installed: bool,
    pub authenticated: bool,
    pub account: Option<String>,
    pub error: Option<String>,
    pub step_failed: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckProgress {
    pub step: String,
    pub message: String,
}

#[tauri::command]
async fn check_claude_status() -> Result<AuthStatus, String> {
    log::info!("Starting Claude CLI status check");

    // Step 1: Check if claude is installed (with timeout)
    log::info!("Step 1: Checking if Claude CLI is installed...");

    let version_result = timeout(
        Duration::from_secs(CLI_TIMEOUT_SECS),
        Command::new("claude").arg("--version").output(),
    )
    .await;

    let installed: bool = match version_result {
        Ok(Ok(output)) => {
            let success: bool = output.status.success();
            if success {
                let version: String = String::from_utf8_lossy(&output.stdout).trim().to_string();
                log::info!("Claude CLI found: {}", version);
            } else {
                log::warn!("Claude CLI command failed with status: {}", output.status);
            }
            success
        }
        Ok(Err(e)) => {
            log::error!("Failed to execute claude --version: {}", e);
            return Ok(AuthStatus {
                installed: false,
                authenticated: false,
                account: None,
                error: Some(format!("Failed to execute claude command: {}", e)),
                step_failed: Some("version_check".to_string()),
            });
        }
        Err(_) => {
            log::error!("Timeout while checking Claude CLI version");
            return Ok(AuthStatus {
                installed: false,
                authenticated: false,
                account: None,
                error: Some(format!(
                    "Timeout after {}s while checking Claude CLI",
                    CLI_TIMEOUT_SECS
                )),
                step_failed: Some("version_check_timeout".to_string()),
            });
        }
    };

    if !installed {
        log::info!("Claude CLI not installed");
        return Ok(AuthStatus {
            installed: false,
            authenticated: false,
            account: None,
            error: None,
            step_failed: None,
        });
    }

    // Step 2: Check auth status (with timeout)
    log::info!("Step 2: Checking Claude CLI authentication status...");

    let auth_result = timeout(
        Duration::from_secs(CLI_TIMEOUT_SECS),
        Command::new("claude").arg("auth").arg("status").output(),
    )
    .await;

    let auth_output: std::process::Output = match auth_result {
        Ok(Ok(output)) => {
            log::info!("Auth check completed with status: {}", output.status);
            output
        }
        Ok(Err(e)) => {
            log::error!("Failed to execute claude auth status: {}", e);
            return Ok(AuthStatus {
                installed: true,
                authenticated: false,
                account: None,
                error: Some(format!("Failed to check auth status: {}", e)),
                step_failed: Some("auth_check".to_string()),
            });
        }
        Err(_) => {
            log::error!("Timeout while checking Claude CLI auth status");
            return Ok(AuthStatus {
                installed: true,
                authenticated: false,
                account: None,
                error: Some(format!(
                    "Timeout after {}s while checking auth status",
                    CLI_TIMEOUT_SECS
                )),
                step_failed: Some("auth_check_timeout".to_string()),
            });
        }
    };

    let stdout: String = String::from_utf8_lossy(&auth_output.stdout).to_string();
    let stderr: String = String::from_utf8_lossy(&auth_output.stderr).to_string();

    log::debug!("Auth stdout: {}", stdout);
    log::debug!("Auth stderr: {}", stderr);

    // Parse the output to determine if authenticated
    let stdout_lower: String = stdout.to_lowercase();
    let stderr_lower: String = stderr.to_lowercase();

    let authenticated: bool = auth_output.status.success()
        && !stdout_lower.contains("not logged in")
        && !stderr_lower.contains("not logged in")
        && !stdout_lower.contains("no active account")
        && !stderr_lower.contains("no active account");

    log::info!("Authentication status: {}", authenticated);

    // Try to extract account info from output
    let account: Option<String> = if authenticated {
        stdout
            .lines()
            .find(|line: &&str| -> bool { line.contains('@') || line.contains("account") })
            .map(|s: &str| -> String { s.trim().to_string() })
    } else {
        None
    };

    if let Some(ref acc) = account {
        log::info!("Authenticated account: {}", acc);
    }

    Ok(AuthStatus {
        installed: true,
        authenticated,
        account,
        error: None,
        step_failed: None,
    })
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
    let mut child: tokio::process::Child = Command::new("claude")
        .arg("-p")
        .arg(&full_prompt)
        .arg("--output-format")
        .arg("text")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e: std::io::Error| -> String {
            log::error!("Failed to spawn claude process: {}", e);
            format!("Failed to spawn claude process: {}", e)
        })?;

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
        .invoke_handler(tauri::generate_handler![check_claude_status, send_to_claude,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
