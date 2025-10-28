package main

import (
	"fmt"
	"html"
	"strings"
	"syscall/js"

	"github.com/sergi/go-diff/diffmatchpatch"
)

// Global diff engine instance
var dmp *diffmatchpatch.DiffMatchPatch

func main() {
	// Initialize diff engine
	dmp = diffmatchpatch.New()

	// Set up WASM exports for JavaScript
	js.Global().Set("generateSideBySideDiff", js.FuncOf(generateSideBySideDiff))
	js.Global().Set("generateUnifiedDiff", js.FuncOf(generateUnifiedDiff))
	js.Global().Set("generateDiffStats", js.FuncOf(generateDiffStats))

	// Keep the Go program running
	<-make(chan bool)
}

// generateSideBySideDiff creates GitHub-style side-by-side HTML diff
func generateSideBySideDiff(this js.Value, inputs []js.Value) interface{} {
	if len(inputs) < 4 {
		return "Error: Need oldText, newText, oldLabel, newLabel"
	}

	oldText := inputs[0].String()
	newText := inputs[1].String()
	oldLabel := inputs[2].String()
	newLabel := inputs[3].String()

	// Generate line-by-line diff
	oldLines := strings.Split(oldText, "\n")
	newLines := strings.Split(newText, "\n")

	// Use diffmatchpatch to get the differences
	diffs := dmp.DiffMain(oldText, newText, false)
	dmp.DiffCleanupSemantic(diffs)

	// Convert to side-by-side HTML
	html := generateSideBySideHTML(oldLines, newLines, diffs, oldLabel, newLabel)

	return html
}

// generateUnifiedDiff creates git-style unified diff
func generateUnifiedDiff(this js.Value, inputs []js.Value) interface{} {
	if len(inputs) < 2 {
		return "Error: Need oldText, newText"
	}

	oldText := inputs[0].String()
	newText := inputs[1].String()

	diffs := dmp.DiffMain(oldText, newText, false)
	patches := dmp.PatchMake(oldText, diffs)
	patchText := dmp.PatchToText(patches)

	return patchText
}

// generateDiffStats returns addition/deletion counts
func generateDiffStats(this js.Value, inputs []js.Value) interface{} {
	if len(inputs) < 2 {
		return js.ValueOf(map[string]interface{}{
			"additions": 0,
			"deletions": 0,
			"total":     0,
		})
	}

	oldText := inputs[0].String()
	newText := inputs[1].String()

	diffs := dmp.DiffMain(oldText, newText, false)

	additions := 0
	deletions := 0

	for _, diff := range diffs {
		switch diff.Type {
		case diffmatchpatch.DiffInsert:
			additions += strings.Count(diff.Text, "\n")
			if !strings.HasSuffix(diff.Text, "\n") {
				additions++ // Count last line if no trailing newline
			}
		case diffmatchpatch.DiffDelete:
			deletions += strings.Count(diff.Text, "\n")
			if !strings.HasSuffix(diff.Text, "\n") {
				deletions++ // Count last line if no trailing newline
			}
		}
	}

	return js.ValueOf(map[string]interface{}{
		"additions": additions,
		"deletions": deletions,
		"total":     additions + deletions,
	})
}

// generateSideBySideHTML creates the GitHub-style side-by-side diff HTML
func generateSideBySideHTML(oldLines, newLines []string, diffs []diffmatchpatch.Diff, oldLabel, newLabel string) string {
	var htmlBuilder strings.Builder

	// Header with file names
	htmlBuilder.WriteString(`<div class="diff-viewer">`)
	htmlBuilder.WriteString(`<div class="diff-header">`)
	htmlBuilder.WriteString(fmt.Sprintf(`<div class="diff-header-old">%s</div>`, html.EscapeString(oldLabel)))
	htmlBuilder.WriteString(fmt.Sprintf(`<div class="diff-header-new">%s</div>`, html.EscapeString(newLabel)))
	htmlBuilder.WriteString(`</div>`)

	// Content container
	htmlBuilder.WriteString(`<div class="diff-content">`)
	htmlBuilder.WriteString(`<div class="diff-side diff-side-old">`)

	// Process diffs into line-by-line changes
	oldLineNum := 1
	newLineNum := 1

	// Convert diffs to line-based representation
	type DiffLine struct {
		Type    diffmatchpatch.Operation
		OldNum  int
		NewNum  int
		Content string
	}

	var diffLines []DiffLine

	// Process each diff operation
	for _, diff := range diffs {
		lines := strings.Split(diff.Text, "\n")

		// Handle last empty line (if text doesn't end with newline)
		if len(lines) > 0 && lines[len(lines)-1] == "" {
			lines = lines[:len(lines)-1]
		}

		for _, line := range lines {
			switch diff.Type {
			case diffmatchpatch.DiffEqual:
				diffLines = append(diffLines, DiffLine{
					Type:    diffmatchpatch.DiffEqual,
					OldNum:  oldLineNum,
					NewNum:  newLineNum,
					Content: line,
				})
				oldLineNum++
				newLineNum++

			case diffmatchpatch.DiffDelete:
				diffLines = append(diffLines, DiffLine{
					Type:    diffmatchpatch.DiffDelete,
					OldNum:  oldLineNum,
					NewNum:  -1,
					Content: line,
				})
				oldLineNum++

			case diffmatchpatch.DiffInsert:
				diffLines = append(diffLines, DiffLine{
					Type:    diffmatchpatch.DiffInsert,
					OldNum:  -1,
					NewNum:  newLineNum,
					Content: line,
				})
				newLineNum++
			}
		}
	}

	// Generate old side
	for _, diffLine := range diffLines {
		switch diffLine.Type {
		case diffmatchpatch.DiffEqual:
			htmlBuilder.WriteString(fmt.Sprintf(`<div class="diff-line diff-line-unchanged">%d %s</div>`,
				diffLine.OldNum, html.EscapeString(diffLine.Content)))
		case diffmatchpatch.DiffDelete:
			htmlBuilder.WriteString(fmt.Sprintf(`<div class="diff-line diff-line-deleted">%d %s</div>`,
				diffLine.OldNum, html.EscapeString(diffLine.Content)))
		case diffmatchpatch.DiffInsert:
			htmlBuilder.WriteString(`<div class="diff-line diff-line-empty"></div>`)
		}
	}

	htmlBuilder.WriteString(`</div>`) // Close old side
	htmlBuilder.WriteString(`<div class="diff-side diff-side-new">`)

	// Generate new side
	for _, diffLine := range diffLines {
		switch diffLine.Type {
		case diffmatchpatch.DiffEqual:
			htmlBuilder.WriteString(fmt.Sprintf(`<div class="diff-line diff-line-unchanged">%d %s</div>`,
				diffLine.NewNum, html.EscapeString(diffLine.Content)))
		case diffmatchpatch.DiffInsert:
			htmlBuilder.WriteString(fmt.Sprintf(`<div class="diff-line diff-line-added">%d %s</div>`,
				diffLine.NewNum, html.EscapeString(diffLine.Content)))
		case diffmatchpatch.DiffDelete:
			htmlBuilder.WriteString(`<div class="diff-line diff-line-empty"></div>`)
		}
	}

	htmlBuilder.WriteString(`</div>`) // Close new side
	htmlBuilder.WriteString(`</div>`) // Close content
	htmlBuilder.WriteString(`</div>`) // Close viewer

	return htmlBuilder.String()
}
