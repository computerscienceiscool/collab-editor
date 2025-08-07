
use wasm_bindgen::prelude::*;
use flate2::Compression;
use flate2::write::{GzEncoder, GzDecoder};
use std::io::prelude::*;
// use regex::Regex;

#[wasm_bindgen]
pub fn export_to_markdown(raw: &str) -> String {
    raw.to_string()
}

// Compress the document
#[wasm_bindgen]
pub fn compress_document(data: &str) -> Vec<u8> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data.as_bytes()).unwrap();
    encoder.finish().unwrap()
}

// Decompress the document
#[wasm_bindgen]
pub fn decompress_document(compressed_data: &[u8]) -> String {
    let mut decoder = GzDecoder::new(Vec::new());
    decoder.write_all(compressed_data).unwrap();
    let decompressed = decoder.finish().unwrap();
    String::from_utf8(decompressed).unwrap_or_else(|_| String::new())
}


// Format the text for better readability and consistency
#[wasm_bindgen]
pub fn format_text(input: &str) -> String {
    let mut text = input.to_string();
    
    // 1. Clean up extra whitespace and line breaks
    text = clean_whitespace(&text);
    
    // 2. Fix markdown headers
    text = fix_markdown_headers(&text);
    
    // 3. Format code blocks
    text = format_code_blocks(&text);
    
    // 4. Fix bold, italic, underline formatting
    text = fix_markdown_formatting(&text);

    // 5. Fix punctuation.  This  fixes common punctuation spacing issues and cleans up double
    //    punctuation.  //    It also ensures that punctuation is properly spaced from words.
    text = fix_punctuation(&text);
    
    text
}

use regex::Regex;
fn clean_whitespace(text: &str) -> String {
    let re_multiple_spaces = Regex::new(r" {2,}").unwrap();
    let re_multiple_newlines = Regex::new(r"\n{3,}").unwrap();
    let re_trailing_spaces = Regex::new(r" +$").unwrap();
    
    let mut result = re_multiple_spaces.replace_all(text, " ").to_string();
    result = re_multiple_newlines.replace_all(&result, "\n\n").to_string();
    result = re_trailing_spaces.replace_all(&result, "").to_string();
    
    result.trim().to_string()
}

fn is_url(text: &str) -> bool {
    text.starts_with("http://") || 
    text.starts_with("https://") || 
    text.starts_with("ftp://") ||
    text.starts_with("www.")
}


fn fix_markdown_headers(text: &str) -> String {
    let re_headers = Regex::new(r"^(#{1,6}) *(.+)$").unwrap();
    
    text.lines()
        .map(|line| {
            re_headers.replace(line, |caps: &regex::Captures| {
                format!("{} {}", &caps[1], &caps[2].trim())
            }).to_string()
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn format_code_blocks(text: &str) -> String {
    let re_code_blocks = Regex::new(r"```([a-zA-Z]*)\n([\s\S]*?)\n```").unwrap();
    
    re_code_blocks.replace_all(text, |caps: &regex::Captures| {
        let lang = &caps[1];
        let code = caps[2].trim();
        format!("```{}\n{}\n```", lang, code)
    }).to_string()
}

fn fix_markdown_formatting(text: &str) -> String {
    let mut result = text.to_string();
    
    // Fix bold formatting
    let re_bold = Regex::new(r"\*\* *([^*]+?) *\*\*").unwrap();
    result = re_bold.replace_all(&result, "**$1**").to_string();
    
    // Fix italic formatting  
    let re_italic = Regex::new(r"\* *([^*]+?) *\*").unwrap();
    result = re_italic.replace_all(&result, "*$1*").to_string();
    
    result
}

// Toggle bold formatting on selected text
#[wasm_bindgen]
pub fn toggle_bold(text: &str) -> String {
    let trimmed = text.trim();
    
    // Check if text is already bold (wrapped in **)
    if trimmed.starts_with("**") && trimmed.ends_with("**") && trimmed.len() > 4 {
        // Remove bold formatting
        trimmed[2..trimmed.len()-2].to_string()
    } else {
        // Add bold formatting
        format!("**{}**", trimmed)
    }
}

// Toggle italic formatting on selected text
#[wasm_bindgen]
pub fn toggle_italic(text: &str) -> String {
    let trimmed = text.trim();
    
    // Check if text is already italic (wrapped in single *)
    // Make sure it's not bold (**) by checking it doesn't start with **
    if trimmed.starts_with("*") && trimmed.ends_with("*") && trimmed.len() > 2 
        && !trimmed.starts_with("**") {
        // Remove italic formatting
        trimmed[1..trimmed.len()-1].to_string()
    } else {
        // Add italic formatting
        format!("*{}*", trimmed)
    }
}

// Toggle underline formatting on selected text
#[wasm_bindgen]
pub fn toggle_underline(text: &str) -> String {
    let trimmed = text.trim();
    
    // Check if text is already underlined (wrapped in __)
    if trimmed.starts_with("__") && trimmed.ends_with("__") && trimmed.len() > 4 {
        // Remove underline formatting
        trimmed[2..trimmed.len()-2].to_string()
    } else {
        // Add underline formatting
        format!("__{}__", trimmed)
    }
}

/// Toggle strikethrough formatting using `~~text~~`
#[wasm_bindgen]
pub fn toggle_strikethrough(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.starts_with("~~") && trimmed.ends_with("~~") && trimmed.len() > 4 {
        trimmed[2..trimmed.len()-2].to_string()
    } else {
        format!("~~{}~~", trimmed)
    }
}



/// Toggle markdown heading level (e.g. "# Heading" -> "## Heading")
#[wasm_bindgen]
pub fn toggle_heading(text: &str, level: u8) -> String {
    let trimmed = text.trim();

    // Compile regex safely
    let re = Regex::new(r"^(#{1,6})\\s+(.*)$");
    if re.is_err() {
        return format!("<!-- regex compile failed -->\n{}", text);
    }
    let re = re.unwrap();

    if let Some(caps) = re.captures(trimmed) {
        let content = caps.get(2).map_or("", |m| m.as_str()).trim();
        format!("{} {}", "#".repeat(level as usize), content)
    } else {
        // fallback: no match, just prepend heading
        format!("{} {}", "#".repeat(level as usize), trimmed)
    }
}

/// Toggle markdown bullet list (add/remove `- ` at the start of each line)
#[wasm_bindgen]
pub fn toggle_list(text: &str) -> String {
    let lines: Vec<&str> = text.lines().collect();
    let is_list = lines.iter().all(|line| line.trim_start().starts_with("- "));

    if is_list {
        // Remove `- ` from each line
        lines.iter()
            .map(|line| line.trim_start().trim_start_matches("- ").to_string())
            .collect::<Vec<String>>()
            .join("\n")
    } else {
        // Add `- ` to each line
        lines.iter()
            .map(|line| format!("- {}", line.trim()))
            .collect::<Vec<String>>()
            .join("\n")
    }
}










#[wasm_bindgen]
pub fn calculate_document_stats(text: &str) -> String {
    let words = count_words(text);
    let chars_with_spaces = text.len();
    let chars_without_spaces = text.chars().filter(|c| !c.is_whitespace()).count();
    let lines = count_lines(text);
    let reading_time = estimate_reading_time(words);
    
    // Return as JSON string for easy parsing in JS
    format!(
        "{{\"words\":{},\"chars_with_spaces\":{},\"chars_without_spaces\":{},\"lines\":{},\"reading_time\":{}}}",
        words, chars_with_spaces, chars_without_spaces, lines, reading_time
    )
}

fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

fn count_lines(text: &str) -> usize {
    if text.is_empty() {
        0
    } else {
        text.lines().count()
    }
}

fn estimate_reading_time(words: usize) -> usize {
    // Average reading speed: 200 words per minute
    let minutes = (words as f64 / 200.0).ceil() as usize;
    if minutes == 0 { 1 } else { minutes }
}



fn fix_punctuation(text: &str) -> String {
    let mut result = text.to_string();
    
    // Fix common punctuation spacing issues
    result = result.replace(" ,", ",");
    result = result.replace(" .", ".");
    result = result.replace("( ", "(").replace(" )", ")");
    result = result.replace(" :", ":");
    result = result.replace(" ;", ";");
    result = result.replace(" !", "!");
    result = result.replace(" ?", "?");
    
    // Fix multiple punctuation
    result = result.replace("..", ".").replace(",,", ",");
    
    result
}

#[wasm_bindgen]
pub fn convert_url_to_markdown(text: &str) -> String {
    let trimmed = text.trim(); // This removes leading/trailing whitespace
    
    // Check if it's already a markdown link
    if trimmed.starts_with("[") && trimmed.contains("](") && trimmed.ends_with(")") {
        return text.to_string(); // Return original text to preserve spacing
    }
    
    // Check if it looks like a URL
    if is_url(trimmed) {
        // Replace just the URL part, preserve any surrounding whitespace
        let before_trim = &text[..text.len() - text.trim_start().len()];
        let after_trim = &text[trimmed.len() + before_trim.len()..];
        format!("{}[{}]({}){}", before_trim, trimmed, trimmed, after_trim)
    } else {
        text.to_string()
    }
}
