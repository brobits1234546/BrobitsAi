const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const mainContent = document.getElementById("main-content");
const animatedPlaceholder = document.getElementById("animated-placeholder");

const welcomeMessages = [
    "Hi there! Great to see you again.",
    "Hello! How can I help you today?",
    "Hey! Hope you're having a nice day.",
    "Welcome back! What would you like to do?",
    "Hi! I'm here and ready to assist you.",
    "Hello! Need help with something?",
    "Hey there! Let's get started.",
    "Good to see you! What's on your mind today?",
    "Hi! I'm always happy to help.",
    "Welcome! Let's make something awesome together."
];

const inputPlaceholders = [
    "Type your question here...",
    "Ask me anything!",
    "What can I help you with today?",
    "Start typing to chat...",
    "Need assistance? Just say hi!",
    "Enter your message...",
    "How can I make your day easier?",
    "Got a question? I've got answers!",
    "Let's talk! Type something below...",
    "What's on your mind?"
];

function addMessage(message, isUser=false, isThinking=false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;

    if (!isUser && !isThinking) {
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        messageDiv.appendChild(avatar);
    }

    if (isThinking) {
        messageDiv.classList.add("thinking");
        messageDiv.innerHTML += `
            <div class="content">
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    } else {
        const content = document.createElement("div");
        content.className = "content";

        const text = document.createElement("div");

        text.innerHTML = ''; // Start empty for typing animation
        content.appendChild(text);
        messageDiv.appendChild(content);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

function typeMessage(messageDiv, message) {
    const textElement = messageDiv.querySelector('div');
    let index = 0;

    // Process message for formatting
    let formattedMessage = message
        // .replace(/\n\n/g, ' ')
        // .replace(/\n/g, ' ')
        // .replace(/\*\*(.*?)\*\*/g, ' ')
        // .replace(/\*(.*?)\*/g, ' ')
        // .replace(/`(.*?)`/g, '')
        // .replace(/^(\d+)\.\s(.*)$/gm, '')
        // .replace(/^\*\s(.*)$/gm, '')
        // .replace(/^>\s(.*)$/gm, '');

    // Handle lists
    formattedMessage = formattedMessage.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
        if (match.includes('data-type="numbered"')) {
            return '<ol>' + match.replace(/data-type="numbered"/g, '') + '</ol>';
        } else {
            return '<ul>' + match + '</ul>';
        }
    });

    const chars = formattedMessage.split('');

    function typeChar() {
        if (index < chars.length) {
            textElement.innerHTML += chars[index];
            index++;
            chatMessages.scrollTop = chatMessages.scrollHeight;
            setTimeout(typeChar, 10); // Adjust speed here (milliseconds per character)
        }
    }

    typeChar();
}

let currentPlaceholderIndex = 0;
let isAnimating = false;

function startPlaceholderAnimation() {
    if (isAnimating) return;
    isAnimating = true;

    function animatePlaceholder() {
        const placeholder = inputPlaceholders[currentPlaceholderIndex];
        animatedPlaceholder.textContent = placeholder;
        animatedPlaceholder.style.animation = 'none';

        // Type animation
        setTimeout(() => {
            animatedPlaceholder.style.animation = 'typing 2s steps(40, end)';

            // After typing completes, wait then clear with animation
            setTimeout(() => {
                // Clear animation (backspace effect)
                animatedPlaceholder.style.animation = 'clearing 1s steps(40, end)';

                setTimeout(() => {
                    animatedPlaceholder.style.animation = 'none';
                    animatedPlaceholder.textContent = '';

                    // Move to next placeholder
                    currentPlaceholderIndex = (currentPlaceholderIndex + 1) % inputPlaceholders.length;

                    // Wait before starting next animation
                    setTimeout(animatePlaceholder, 1000);
                }, 1000); // Wait for clear animation to complete
            }, 2500); // Wait 2.5 seconds after typing completes
        }, 10);
    }

    animatePlaceholder();
}

function showPlaceholder() {
    animatedPlaceholder.style.display = 'block';
    if (!isAnimating) {
        startPlaceholderAnimation();
    }
}

function hidePlaceholder() {
    animatedPlaceholder.style.display = 'none';
    isAnimating = false;
}


async function sendMessage(message) {
    // Remove welcome message if it exists
    const welcomeMessage = document.querySelector(".welcome-message");
    if (welcomeMessage) {
        welcomeMessage.remove();
        chatMessages.classList.remove("empty");
    }

    // Add user message immediately
    const userDiv = document.createElement("div");
    userDiv.className = "message user-message";
    const userContent = document.createElement("div");
    userContent.className = "content";
    const userText = document.createElement("div");
    userText.className = "text";
    userText.textContent = message;
    userContent.appendChild(userText);
    userDiv.appendChild(userContent);
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveMessage(message, true);

    // Clear input and hide placeholder
    userInput.value = "";
    userInput.style.height = "auto";
    sendButton.disabled = true;
    hidePlaceholder();

    // Add AI message immediately
    const aiMessage = addMessage("", false);
    const textElement = aiMessage.querySelector('.content div');

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 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"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: message }],
                stream: true
            })
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') {
                        break;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta;
                        if (delta?.content) {
                            // Process content live
                            let content = delta.content;
                            content = content.replace(/^#+\s/gm, ''); // Headers
                            content = content.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
                            content = content.replace(/\*(.*?)\*/g, '$1'); // Italic
                            content = content.replace(/`(.*?)`/g, '$1'); // Code
                            content = content.replace(/~~(.*?)~~/g, '$1'); // Strikethrough
                            textElement.innerHTML += content;
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        }

        // Process markdown to HTML
        let processed = textElement.innerHTML;
        // Remove markdown formatting first
        processed = processed.replace(/^#+\s/gm, ''); // Headers
        processed = processed.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        processed = processed.replace(/\*(.*?)\*/g, '$1'); // Italic
        processed = processed.replace(/`(.*?)`/g, '$1'); // Code
        processed = processed.replace(/~~(.*?)~~/g, '$1'); // Strikethrough
        // Convert explicit lists
        processed = processed.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
        processed = processed.replace(/(<li>.*<\/li>\s*)+/g, '<ol>$&</ol>');
        processed = processed.replace(/^- (.+)$/gm, '<li>$1</li>');
        processed = processed.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
        // Convert plain lists after headers (simple heuristic)
        const lines = processed.split('\n');
        let inList = false;
        let listItems = [];
        let result = [];
        for (let line of lines) {
            line = line.trim();
            if (line === '') {
                if (inList) {
                    result.push('<ol>' + listItems.join('') + '</ol>');
                    listItems = [];
                    inList = false;
                }
                result.push('');
            } else if (line.match(/^[A-Z]/) && !inList) {
                // Assume it's a header or list item
                if (listItems.length === 0) {
                    result.push(line);
                    inList = true;
                }
                listItems.push('<li>' + line + '</li>');
            } else {
                if (inList) {
                    listItems.push('<li>' + line + '</li>');
                } else {
                    result.push(line);
                }
            }
        }
        if (inList) {
            result.push('<ol>' + listItems.join('') + '</ol>');
        }
        processed = result.join('\n');
        textElement.innerHTML = processed;
    } catch (err) {
        console.error(err);
        textElement.innerHTML = "🚫 Oops! Something went wrong. Please try again.";
    }
}

sendButton.addEventListener("click", () => {
    const message = userInput.value.trim();
    if (message) {
        sendMessage(message);
        userInput.value = "";
        userInput.style.height = "auto";
        sendButton.disabled = true;
    }
});

userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = userInput.scrollHeight + "px";
    const hasText = userInput.value.trim() !== "";
    sendButton.disabled = !hasText;
    if (hasText) {
        hidePlaceholder();
    } else {
        showPlaceholder();
    }
});

userInput.addEventListener("keypress", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});

userInput.addEventListener("focus", () => {
    hidePlaceholder();
});

userInput.addEventListener("blur", () => {
    if (userInput.value.trim() === "") {
        showPlaceholder();
    }
});

// Sidebar toggle functionality
sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    mainContent.classList.toggle("sidebar-open");
});

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove("open");
        mainContent.classList.remove("sidebar-open");
    }
});

// Close sidebar on escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        mainContent.classList.remove("sidebar-open");
    }
});

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.querySelector('span').textContent.toLowerCase();
        showPage(target);
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

function showPage(pageName) {
    pages.forEach(page => page.classList.add('hidden'));
    document.getElementById(`${pageName}-page`).classList.remove('hidden');
    if (pageName === 'chat') {
        // Show placeholder if input is empty
        if (userInput.value.trim() === '') {
            showPlaceholder();
        }
    } else {
        hidePlaceholder();
    }
    if (pageName === 'history') {
        loadHistory();
    }
}

// Chat history
function saveMessage(message, isUser) {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history.push({ message, isUser, timestamp: Date.now() });
    if (history.length > 50) history.shift(); // Keep last 50
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.isUser ? 'user' : 'ai'}`;
        div.textContent = item.message;
        historyList.appendChild(div);
    });
}

// Settings
const themeSelect = document.getElementById('theme-select');
const fontSizeInput = document.getElementById('font-size');

themeSelect.addEventListener('change', (e) => {
    document.body.className = e.target.value;
    localStorage.setItem('theme', e.target.value);
});

fontSizeInput.addEventListener('input', (e) => {
    document.documentElement.style.fontSize = e.target.value + 'px';
    localStorage.setItem('fontSize', e.target.value);
});

// Load settings
const savedTheme = localStorage.getItem('theme') || 'light';
const savedFontSize = localStorage.getItem('fontSize') || '15';
themeSelect.value = savedTheme;
document.body.className = savedTheme;
fontSizeInput.value = savedFontSize;
document.documentElement.style.fontSize = savedFontSize + 'px';

// Display random welcome message on page load
window.addEventListener("load", () => {
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const welcomeDiv = document.createElement("div");
    welcomeDiv.className = "welcome-message";
    welcomeDiv.textContent = randomMessage;
    chatMessages.appendChild(welcomeDiv);
    chatMessages.classList.add("empty");

    // Initialize placeholder
    showPlaceholder();
});



