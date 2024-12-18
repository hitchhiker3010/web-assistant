# WebSummarizer Chrome Extension - Project Documentation

## Overview
WebSummarizer is a Chrome extension that leverages browser-based Large Language Models (LLMs) to provide webpage summarization and Q&A capabilities. The extension runs entirely in the browser, ensuring user privacy by processing all content locally without sending data to external servers.

## Key Features
- Webpage content summarization
- Question & Answer functionality based on webpage content
- Local LLM processing using MLC Web LLM
- Multiple model options with different size/performance tradeoffs
- Progress tracking for model loading
- Conversation history for Q&A mode

## Technical Architecture

### Components

1. **Extension Structure**
   - `manifest.json`: Extension configuration and permissions
   - `popup.html`: Main UI interface
   - `popup.js`: Core logic and LLM integration
   - `content.js`: Webpage content extraction
   - `background.js`: Background service worker
   - `styles.css`: Custom styling
   - `web-llm-init.js`: LLM initialization module

2. **Dependencies**
   - `@mlc-ai/web-llm`: Browser-based LLM processing
   - Bootstrap: UI framework
   - Chrome Extension APIs

### LLM Integration
- Uses MLC Web LLM for in-browser inference
- Supports multiple quantized models:
  - SmolLM2 135M Instruct (Fastest, smallest)
  - SmolLM2 1.7B Instruct
  - Llama 3.2 1B Instruct
  - Qwen2.5 1.5B Instruct

### Content Processing
1. Content Extraction:
   - Prioritizes user-selected text
   - Falls back to main article content
   - Filters out navigation, headers, footers
   - Handles dynamic content updates

2. Summarization:
   - Uses system prompt for concise summaries
   - Streams responses for better UX
   - Low temperature (0.01) for consistent output

3. Q&A:
   - Maintains conversation history
   - Context-aware responses
   - Supports follow-up questions

## Implementation Details

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```
- Allows WASM execution for LLM processing
- Restricts script sources to extension files

### LLM Configuration
```javascript
{
  context_window_size: -1,
  sliding_window_size: 4096,
  attention_sink_size: 8
}
```
- Optimized for webpage content processing
- Handles long-form content efficiently

### State Management
- Model state persisted in chrome.storage.local
- Conversation history maintained in memory
- Content cache for current webpage

## Development Setup

1. **Prerequisites**
   ```bash
   # Node.js and npm required
   npm install
   ```

2. **Build Process**
   ```bash
   # Development build
   npm run dev

   # Production package
   npm run package
   ```

3. **Chrome Installation**
   - Navigate to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `dist` directory

## Usage Instructions

1. **Model Selection**
   - Choose model based on needs:
     - SmolLM2 135M: Quick responses, basic tasks
     - Larger models: More nuanced understanding

2. **Content Processing**
   - Select specific text or let extension auto-detect
   - Wait for model loading (progress bar)
   - Choose mode: Summarize or Q&A

3. **Best Practices**
   - Start with smaller models for testing
   - Use selected text for more focused results
   - Clear conversation history for new topics

## Technical Considerations

### Performance
- Models are downloaded once and cached
- WASM execution optimized for browser
- Streaming responses for better UX

### Memory Management
- Models unloaded when switching
- Conversation history cleared on tab change
- Automatic garbage collection

### Security
- Local processing only
- No external API calls
- Content script isolation

### Browser Compatibility
- Chrome/Chromium browsers
- Requires WASM support
- Minimum Chrome version: 80+

## Troubleshooting

Common Issues:
1. **Model Loading Fails**
   - Check internet connection
   - Verify sufficient memory
   - Try smaller model first

2. **Content Extraction Issues**
   - Refresh the page
   - Try selecting text manually
   - Check page structure

3. **Performance Problems**
   - Switch to smaller model
   - Clear conversation history
   - Restart browser if needed


## License
MIT License - See LICENSE file for details 