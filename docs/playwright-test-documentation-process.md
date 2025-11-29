# LLM-Assisted Playwright Test Generation Process

This document describes the process for using Claude.ai with GitHub integration to generate Playwright end-to-end tests.

## Overview

Claude.ai can generate Playwright test scripts when given proper context through documentation and code. The key insight is that **documentation serves as LLM input** — well-maintained docs enable effective test generation.

## Prerequisites

- Claude.ai account with GitHub integration enabled
- GitHub repository with:
  - Up-to-date documentation (README, user guides, feature docs)
  - Existing Playwright configuration
  - Clear feature code organization

## Process

### Step 1: Connect GitHub Repository

1. Start a new conversation in Claude.ai
2. Connect your GitHub repository when you need to reference code
3. The connection persists for the duration of the conversation

### Step 2: Provide Context

Give Claude the relevant files for the feature area you want to test:

- **README.md** — project overview
- **Feature-specific documentation** — user guides, keyboard shortcuts, etc.
- **Feature code** — only the code relevant to what you're testing

> **Tip:** By providing documentation and specific feature code (rather than the entire codebase), token limits are typically not an issue.

### Step 3: Request High-Level Test Plan

Before generating code, ask Claude to outline the tests at a high level:

```
Here is the documentation for [feature area].
Here is the code for [feature area].

What tests should we write for this feature? 
Please describe each test in a few words — no code yet.
```

Review the proposed tests and add any missing test cases.

### Step 4: Generate Playwright Tests

Once the test plan is agreed upon:

```
Please generate Playwright tests for these test cases.
```

**Copy and paste** the generated code (rather than downloading) to get a better look at the test code as you transfer it.

### Step 5: Run and Debug Tests

1. Run the generated tests.  Until they pass, run as headed.  This means we will see it run in the browser.  This helps understand why the test did not pass.
2. If tests fail, paste the error back into Claude:
   ```
   This test failed with the following error:
   [paste error]
   ```
3. Determine the cause:
   - **Test issue** (most common) — fix the test code
   - **Timing issue** (common) — add waits for slow-loading elements
   - **Feature bug** (less common) — fix the feature code

### Step 6: Commit

Only commit after tests pass. The review-run-fix cycle often catches:
- Bugs in the feature code
- Misunderstandings about expected behavior
- Timing/loading issues

## Organizing Work by Feature Area

Use **one conversation per feature area**. A feature area is a set of related functionality, for example:

- Keyboard shortcuts
- Menu system
- Text formatting
- Collaboration features

This keeps conversations focused and within token limits.

## Documentation as LLM Input

Documentation must be accurate because it serves as input for:
- Test generation
- Feature generation
- Consistency checking

### Checking Documentation Consistency

Upload multiple related docs to Claude and ask:

```
Here are three documents that describe [feature]:
- [doc 1]
- [doc 2]  
- [doc 3]

Are there any inconsistencies between them?
```

This helps catch cases where one doc was updated but another wasn't.

## Tips

- **Start broad, then narrow:** High-level test plan first, then code generation
- **Be specific about what to test:** Don't give Claude the entire repo
- **Expect timing issues:** Playwright tests often fail because elements load slowly — add appropriate waits
- **Review before committing:** Claude's output is good but rarely perfect on the first try
- **Keep documentation current:** Outdated docs lead to incorrect tests

## Example Session Flow

1. Connect GitHub repo
2. Upload: README.md, docs/keyboard-shortcuts.md, relevant source code files
3. Ask: "What tests should we write for keyboard shortcuts?"
4. Review Claude's proposed test list, add missing cases
5. Ask: "Generate Playwright tests for these"
6. Copy tests to test file
7. Run tests
8. If failures: show llm the error, get fix, iterate
9. Commit when passing

---

*Document created from process used on the collab-editor project, November 2025*
