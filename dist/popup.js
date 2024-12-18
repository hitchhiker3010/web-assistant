let engine;
let currentContent = '';
let conversationHistory = [];
let currentModel = '';

// Initialize Web LLM
async function initializeEngine() {
    const modelSelect = document.getElementById('model-select');
    const selectedModel = modelSelect.value;

    // If engine exists and model hasn't changed, reuse it
    if (engine && currentModel === selectedModel) {
        return true;
    }

    // If engine exists but model changed, reset it
    if (engine) {
        engine = null;
    }

    try {
        const progressSection = document.getElementById('progress-section');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        progressSection.style.display = 'block';

        const initProgressCallback = (progress) => {
            const percentage = Math.round(progress.progress * 100);
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = progress.text;
        };

        engine = await CreateMLCEngine(
            selectedModel,
            { initProgressCallback },
            {
                context_window_size: -1,
                sliding_window_size: 4096,
                attention_sink_size: 8,
              }
        );

        currentModel = selectedModel;
        
        // Save the selected model to storage
        chrome.storage.local.set({ lastUsedModel: selectedModel });

        return true;
    } catch (error) {
        console.error('Error initializing Web LLM:', error);
        return false;
    } finally {
        document.getElementById('progress-section').style.display = 'none';
    }
}

// Get content from the active tab
async function getTabContent() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Inject content script if not already injected
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getContent' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                    currentContent = 'Error: Could not get content from page. Please refresh the page and try again.';
                } else if (response && response.content) {
                    currentContent = response.content;
                } else {
                    currentContent = 'No content found on the page.';
                }
                document.getElementById('content-display').textContent = currentContent;
                resolve(currentContent);
            });
        });
    } catch (error) {
        console.error('Error getting tab content:', error);
        currentContent = 'Error: ' + error.message;
        document.getElementById('content-display').textContent = currentContent;
        return currentContent;
    }
}

// Generate summary using Web LLM
async function generateSummary() {
    if (!currentContent) {
        alert('No content selected to summarize');
        return;
    }

    const summarizeBtn = document.getElementById('summarize-btn');
    const summaryOutput = document.getElementById('summary-output');
    
    summarizeBtn.classList.add('loading');
    
    try {
        const initialized = await initializeEngine();
        if (!initialized) {
            throw new Error('Failed to initialize the model. Please try again.');
        }

        const messages = [
            { role: "system", content: "You are a helpful AI assistant that provides concise summaries. Be completely factual don't make up stuff." },
            { role: "user", content: `Please provide a concise summary of the following text:\n\n${currentContent}` }
        ];

        summaryOutput.textContent = '';
        const chunks = await engine.chat.completions.create({
            messages,
            temperature: 0.01,
            stream: true,
            stream_options: { include_usage: true }
        });

        let summary = '';
        for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta.content || '';
            summary += content;
            summaryOutput.textContent = summary;
        }
    } catch (error) {
        summaryOutput.textContent = 'Error generating summary: ' + error.message;
    } finally {
        summarizeBtn.classList.remove('loading');
    }
}

// Handle Q&A using Web LLM
async function handleQuestion() {
    const questionInput = document.getElementById('question-input');
    const askBtn = document.getElementById('ask-btn');
    const answerOutput = document.getElementById('answer-output');
    
    const question = questionInput.value.trim();
    if (!question) {
        alert('Please enter a question');
        return;
    }

    askBtn.classList.add('loading');
    
    try {
        const initialized = await initializeEngine();
        if (!initialized) {
            throw new Error('Failed to initialize the model. Please try again.');
        }

        const messages = [
            { role: "system", content: "You are a helpful AI assistant that answers questions based on the given context. Be completely factual don't make up stuff." },
            { role: "user", content: `Context: ${currentContent}\n\nQuestion: ${question}` }
        ];

        // Add conversation history
        if (conversationHistory.length > 0) {
            messages.splice(1, 0, ...conversationHistory.flatMap(item => [
                { role: "user", content: item.question },
                { role: "assistant", content: item.answer }
            ]));
        }

        answerOutput.textContent = '';
        const chunks = await engine.chat.completions.create({
            messages,
            temperature: 0.7,
            stream: true,
            stream_options: { include_usage: true }
        });

        let answer = '';
        for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta.content || '';
            answer += content;
            answerOutput.textContent = answer;
        }

        conversationHistory.push({ question, answer });
        questionInput.value = '';
    } catch (error) {
        answerOutput.textContent = 'Error generating answer: ' + error.message;
    } finally {
        askBtn.classList.remove('loading');
    }
}

// UI Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Restore last used model if any
    const modelSelect = document.getElementById('model-select');
    chrome.storage.local.get(['lastUsedModel'], (result) => {
        if (result.lastUsedModel) {
            modelSelect.value = result.lastUsedModel;
        }
    });

    // Get initial content
    await getTabContent();

    // Mode toggle
    const summarizeMode = document.getElementById('summarize-mode');
    const qaMode = document.getElementById('qa-mode');
    const summarizeSection = document.getElementById('summarize-section');
    const qaSection = document.getElementById('qa-section');

    summarizeMode.addEventListener('change', () => {
        summarizeSection.style.display = 'block';
        qaSection.style.display = 'none';
    });

    qaMode.addEventListener('change', () => {
        summarizeSection.style.display = 'none';
        qaSection.style.display = 'block';
    });

    // Model change handler
    modelSelect.addEventListener('change', () => {
        // Reset the engine when model changes
        engine = null;
        currentModel = '';
    });

    // Button handlers
    document.getElementById('summarize-btn').addEventListener('click', generateSummary);
    document.getElementById('ask-btn').addEventListener('click', handleQuestion);
}); 