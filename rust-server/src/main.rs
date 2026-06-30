
use axum::{
    body::{Body, Bytes},
    extract::DefaultBodyLimit,
    http::{Response, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use std::{fs, net::SocketAddr};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    // Serve static files from ../public
    let static_files = ServeDir::new("../public");

    // Set up the router
    let app = Router::new()
        .nest_service("/", static_files)
        .route("/load", get(load_handler))
        .route("/save", post(save_handler))
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024)); // 10 MB limit

    // Bind to 127.0.0.1:8080
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("Rust server running at http://{}", addr);

    // Start the server using axum's built-in serve method
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

// Handle GET /load -> return doc.yjs if it exists
async fn load_handler() -> impl IntoResponse {
    match fs::read("doc.yjs") {
        Ok(contents) => Response::builder()
            .header("Content-Type", "application/octet-stream")
            .body(Body::from(contents))
            .unwrap(),
        Err(_) => (StatusCode::NOT_FOUND, "doc.yjs not found").into_response(),
    }
}

// Handle POST /save -> save request body to doc.yjs
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
