
use axum::{
    body::{Body, Bytes},
    extract::DefaultBodyLimit,
    http::{Response, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use std::{env, fs};
use std::net::SocketAddr;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
    
    // Read port from environment variable or default to 8080
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8080);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    println!("Rust server running at http://{}", addr);
    // Serve static files from ./public with fallback to index.html
    let static_dir = ServeDir::new("dist").not_found_service(ServeFile::new("dist/index.html"));

    // Set up the router
    let app = Router::new()
        .nest_service("/", static_dir) // Serve index.html and static assets
        .route("/load", get(load_handler)) // API route
        .route("/save", post(save_handler)) // API route
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
