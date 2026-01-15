
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
use std::net::SocketAddr;
use tower_http::services::{ServeDir, ServeFile};

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




#[tokio::main]
async fn main() {
    
    // Read port from environment variable or default to 8080
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(3000);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    println!("Rust server running at http://{}", addr);
    // Serve static files from ./public with fallback to index.html
    let static_dir = ServeDir::new("dist").not_found_service(ServeFile::new("dist/index.html"));

    // Set up the router
    let app = Router::new()
        .nest_service("/", static_dir) // Serve index.html and static assets
        .route("/load", get(load_handler)) // API route
        .route("/save", post(save_handler)) // API route
        .route("/save-cbor", post(save_cbor_handler)) // API route for saving CBOR data
        .route("/load-cbor", get(load_cbor_handler)) // API route for loading CBOR data
        .route("/export", get(export_handler)) // Export document as markdown
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024)); // Set max upload size to 10MB


    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

// Handle GET /load -> Return the Yjs document if it exists
async fn load_handler() -> impl IntoResponse {
    match fs::read("doc.yjs") {
        Ok(contents) => Response::builder()
            .header("Content-Type", "application/octet-stream")
            .body(Body::from(contents))
            .unwrap(),
        Err(_) => (StatusCode::NOT_FOUND, "doc.yjs not found").into_response(),
    }
}

// Handle POST /save -> Save the document
async fn save_handler(body: Bytes) -> impl IntoResponse {
    match fs::write("doc.yjs", &body) {
        Ok(_) => StatusCode::OK.into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to save: {}", err),
        )
            .into_response(),
    }
}



// Handle POST /save-cbor -> Save document as CBOR
async fn save_cbor_handler(body: Bytes) -> impl IntoResponse {
    // Decode CBOR data
    match serde_cbor::from_slice::<DocumentData>(&body) {
        Ok(doc_data) => {
            // Save as CBOR file
            match serde_cbor::to_vec(&doc_data) {
                Ok(cbor_bytes) => {
                    match fs::write("doc.cbor", cbor_bytes) {
                        Ok(_) => StatusCode::OK.into_response(),
                        Err(err) => (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            format!("Failed to save CBOR: {}", err),
                        ).into_response(),
                    }
                },
                Err(err) => (
                    StatusCode::BAD_REQUEST,
                    format!("CBOR encoding failed: {}", err),
                ).into_response(),
            }
        },
        Err(err) => (
            StatusCode::BAD_REQUEST,
            format!("Invalid CBOR data: {}", err),
        ).into_response(),
    }
}

// Handle GET /load-cbor -> Load document from CBOR
async fn load_cbor_handler() -> impl IntoResponse {
    match fs::read("doc.cbor") {
        Ok(cbor_bytes) => {
            match serde_cbor::from_slice::<DocumentData>(&cbor_bytes) {
                Ok(doc_data) => {
                    match serde_cbor::to_vec(&doc_data) {
                        Ok(response_bytes) => Response::builder()
                            .header("Content-Type", "application/cbor")
                            .body(Body::from(response_bytes))
                            .unwrap(),
                        Err(err) => (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            format!("CBOR encoding failed: {}", err),
                        ).into_response(),
                    }
                },
                Err(err) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("CBOR parsing failed: {}", err),
                ).into_response(),
            }
        },
        Err(_) => (StatusCode::NOT_FOUND, "doc.cbor not found").into_response(),
    }
}

// Handle GET /export -> Export document content as markdown/text
async fn export_handler() -> impl IntoResponse {
    // Try CBOR first (preferred format with structured data)
    if let Ok(cbor_bytes) = fs::read("doc.cbor") {
        if let Ok(doc_data) = serde_cbor::from_slice::<DocumentData>(&cbor_bytes) {
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
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            "doc.yjs contains binary data. Use /load endpoint or save as CBOR first.",
        ).into_response();
    }

    (StatusCode::NOT_FOUND, "No document found. Save a document first.").into_response()
}
