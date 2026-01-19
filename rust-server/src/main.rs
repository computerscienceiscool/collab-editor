
use axum::{
    body::{Body, Bytes},
    extract::DefaultBodyLimit,
    http::{Response, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};

// Import necessary crates
use serde::{Serialize, Deserialize};
use std::{env, fs};
use std::fs::File;
use std::io::Write;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tracing::{info, warn, error, debug};

#[derive(Serialize, Deserialize)]
struct DocumentData {
    content: String,
    metadata: DocumentMetadata,
}

#[derive(Serialize, Deserialize)]
struct DocumentMetadata {
    room_id: String,
    timestamp: u64,
    format: String,
}

/// Atomically write data to a file using temp file + rename pattern.
/// This prevents data corruption if the process crashes mid-write.
fn atomic_write(path: &str, data: &[u8]) -> Result<(), String> {
    let temp_path = format!("{}.tmp", path);

    // Validate data isn't empty
    if data.is_empty() {
        return Err("Cannot save empty data".to_string());
    }

    // Write to temp file
    let mut file = File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    file.write_all(data)
        .map_err(|e| format!("Failed to write data: {}", e))?;

    // Flush to disk to ensure data is persisted
    file.sync_all()
        .map_err(|e| format!("Failed to sync to disk: {}", e))?;

    // Atomic rename (overwrites existing file)
    fs::rename(&temp_path, path)
        .map_err(|e| format!("Failed to rename temp file: {}", e))?;

    Ok(())
}




#[tokio::main]
async fn main() {
    // Initialize logging with RUST_LOG env var support (default: info)
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into())
        )
        .init();

    // Read port from environment variable or default to 3000
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    info!("Rust server starting at http://{}", addr);
    // Serve static files from ./public with fallback to index.html
    let static_dir = ServeDir::new("dist").not_found_service(ServeFile::new("dist/index.html"));

    // Configure CORS to allow frontend integration from any origin
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Set up the router
    let app = Router::new()
        .nest_service("/", static_dir) // Serve index.html and static assets
        .route("/load", get(load_handler)) // API route
        .route("/save", post(save_handler)) // API route
        .route("/save-cbor", post(save_cbor_handler)) // API route for saving CBOR data
        .route("/load-cbor", get(load_cbor_handler)) // API route for loading CBOR data
        .route("/export", get(export_handler)) // Export document as markdown
        .layer(cors)
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024)); // Set max upload size to 10MB


    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

// Handle GET /load -> Return the Yjs document if it exists
async fn load_handler() -> impl IntoResponse {
    debug!("GET /load - Loading Yjs document");
    match fs::read("doc.yjs") {
        Ok(contents) => {
            if contents.is_empty() {
                warn!("GET /load - Document is empty");
                return (StatusCode::NO_CONTENT, "Document is empty").into_response();
            }
            info!("GET /load - Loaded {} bytes", contents.len());
            Response::builder()
                .header("Content-Type", "application/octet-stream")
                .body(Body::from(contents))
                .unwrap()
        },
        Err(e) => {
            let msg = match e.kind() {
                std::io::ErrorKind::NotFound => "Document not found. Create a new document first.".to_string(),
                std::io::ErrorKind::PermissionDenied => "Permission denied reading document".to_string(),
                _ => format!("Failed to read document: {}", e),
            };
            warn!("GET /load - {}", msg);
            (StatusCode::NOT_FOUND, msg).into_response()
        },
    }
}

// Handle POST /save -> Save the document (Yjs binary format)
async fn save_handler(body: Bytes) -> impl IntoResponse {
    debug!("POST /save - Saving Yjs document ({} bytes)", body.len());
    // Validate payload
    if body.is_empty() {
        warn!("POST /save - Empty payload rejected");
        return (StatusCode::BAD_REQUEST, "Empty payload").into_response();
    }

    // Use atomic write to prevent corruption
    match atomic_write("doc.yjs", &body) {
        Ok(_) => {
            info!("POST /save - Saved {} bytes", body.len());
            StatusCode::OK.into_response()
        },
        Err(err) => {
            error!("POST /save - Failed: {}", err);
            (StatusCode::INTERNAL_SERVER_ERROR, err).into_response()
        },
    }
}



// Handle POST /save-cbor -> Save document as CBOR
async fn save_cbor_handler(body: Bytes) -> impl IntoResponse {
    debug!("POST /save-cbor - Saving CBOR document ({} bytes)", body.len());
    // Validate payload
    if body.is_empty() {
        warn!("POST /save-cbor - Empty payload rejected");
        return (StatusCode::BAD_REQUEST, "Empty payload").into_response();
    }

    // Decode and validate CBOR data
    let doc_data = match serde_cbor::from_slice::<DocumentData>(&body) {
        Ok(data) => data,
        Err(err) => {
            warn!("POST /save-cbor - Invalid CBOR format: {}", err);
            return (
                StatusCode::BAD_REQUEST,
                format!("Invalid CBOR format: {}", err),
            ).into_response();
        }
    };

    // Validate document content (basic sanity checks)
    if doc_data.metadata.room_id.is_empty() {
        warn!("POST /save-cbor - Missing room_id");
        return (StatusCode::BAD_REQUEST, "Missing room_id in metadata").into_response();
    }

    // Re-encode to ensure clean CBOR
    let cbor_bytes = match serde_cbor::to_vec(&doc_data) {
        Ok(bytes) => bytes,
        Err(err) => {
            error!("POST /save-cbor - CBOR encoding failed: {}", err);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("CBOR encoding failed: {}", err),
            ).into_response();
        }
    };

    // Use atomic write to prevent corruption
    match atomic_write("doc.cbor", &cbor_bytes) {
        Ok(_) => {
            info!("POST /save-cbor - Saved {} bytes (room: {})", cbor_bytes.len(), doc_data.metadata.room_id);
            StatusCode::OK.into_response()
        },
        Err(err) => {
            error!("POST /save-cbor - Failed: {}", err);
            (StatusCode::INTERNAL_SERVER_ERROR, err).into_response()
        },
    }
}

// Handle GET /load-cbor -> Load document from CBOR
async fn load_cbor_handler() -> impl IntoResponse {
    debug!("GET /load-cbor - Loading CBOR document");
    let cbor_bytes = match fs::read("doc.cbor") {
        Ok(bytes) => bytes,
        Err(e) => {
            let msg = match e.kind() {
                std::io::ErrorKind::NotFound => "Document not found. Save a document first.".to_string(),
                std::io::ErrorKind::PermissionDenied => "Permission denied reading document".to_string(),
                _ => format!("Failed to read document: {}", e),
            };
            warn!("GET /load-cbor - {}", msg);
            return (StatusCode::NOT_FOUND, msg).into_response();
        }
    };

    if cbor_bytes.is_empty() {
        warn!("GET /load-cbor - Document is empty");
        return (StatusCode::NO_CONTENT, "Document is empty").into_response();
    }

    // Parse and validate CBOR
    let doc_data = match serde_cbor::from_slice::<DocumentData>(&cbor_bytes) {
        Ok(data) => data,
        Err(err) => {
            error!("GET /load-cbor - Document corrupted: {}", err);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Document corrupted - CBOR parsing failed: {}", err),
            ).into_response();
        }
    };

    info!("GET /load-cbor - Loaded {} bytes (room: {})", cbor_bytes.len(), doc_data.metadata.room_id);

    // Re-encode for response
    match serde_cbor::to_vec(&doc_data) {
        Ok(response_bytes) => Response::builder()
            .header("Content-Type", "application/cbor")
            .body(Body::from(response_bytes))
            .unwrap(),
        Err(err) => {
            error!("GET /load-cbor - CBOR encoding failed: {}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("CBOR encoding failed: {}", err),
            ).into_response()
        },
    }
}

// Handle GET /export -> Export document content as markdown/text
async fn export_handler() -> impl IntoResponse {
    debug!("GET /export - Exporting document as markdown");
    // Try CBOR first (preferred format with structured data)
    if let Ok(cbor_bytes) = fs::read("doc.cbor") {
        if let Ok(doc_data) = serde_cbor::from_slice::<DocumentData>(&cbor_bytes) {
            info!("GET /export - Exported {} chars", doc_data.content.len());
            return Response::builder()
                .header("Content-Type", "text/markdown; charset=utf-8")
                .header("Content-Disposition", "attachment; filename=\"document.md\"")
                .body(Body::from(doc_data.content))
                .unwrap();
        }
    }

    // Fallback: try to read raw text from doc.yjs (legacy format - raw bytes)
    // Note: doc.yjs contains Yjs binary, not plain text, so this is limited
    if let Ok(_) = fs::read("doc.yjs") {
        warn!("GET /export - Only binary doc.yjs available");
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            "doc.yjs contains binary data. Use /load endpoint or save as CBOR first.",
        ).into_response();
    }

    warn!("GET /export - No document found");
    (StatusCode::NOT_FOUND, "No document found. Save a document first.").into_response()
}
