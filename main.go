package main

import (
	"io"
	"log"
	"net/http"
	"os"
)

func handleSave(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", 500)
		return
	}
	err = os.WriteFile("doc.yjs", body, 0644)
	if err != nil {
		http.Error(w, "Failed to write file", 500)
		return
	}
	w.WriteHeader(200)
}

func handleLoad(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	data, err := os.ReadFile("doc.yjs")
	if err != nil {
		http.Error(w, "File not found", 404)
		return
	}
	w.Write(data)
}

func main() {
	fs := http.FileServer(http.Dir("public"))
	http.Handle("/", fs)

	http.HandleFunc("/save", handleSave)
	http.HandleFunc("/load", handleLoad)

	log.Println("Go server running at http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
