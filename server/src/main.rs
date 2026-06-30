use axum::{
    body::Body,
    extract::{DefaultBodyLimit, Multipart},
    http::{Response, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use std::{fs, net::SocketAddr, path::PathBuf};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    // Serve static files from ../public (relative to this binary)
    let static_files = ServeDir::new("../public");

    // Build the app
    let app = Router::new()
        .nest_service("/", static_files)
        .route("/load", get(load_handler))
        .route("/save", post(save_handler))
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024)); // 10 MB limit

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("Rust server running at http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// GET /load → returns doc.yjs file if exists
async fn load_handler() -> impl IntoResponse {
    match fs::read("doc.yjs") {
        Ok(contents) => Response::builder()
            .header("Content-Type", "application/octet-stream")
            .body(Body::from(contents))
            .unwrap(),
        Err(_) => (StatusCode::NOT_FOUND, "doc.yjs not found").into_response(),
    }
}

// POST /save → write raw body to doc.yjs
async fn save_handler(body: Body) -> impl IntoResponse {
    let bytes = hyper::body::to_bytes(body).await;
    match bytes {
        Ok(content) => {
            if let Err(err) = fs::write("doc.yjs", &content) {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to save: {}", err),
                )
                    .into_response();
            }
            StatusCode::OK.into_response()
        }
        Err(_) => (
            StatusCode::BAD_REQUEST,
            "Failed to read request body",
        )
            .into_response(),
    }
}

