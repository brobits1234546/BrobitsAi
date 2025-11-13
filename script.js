const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const mainContent = document.getElementById("main-content");

function addMessage(message, isUser=false, isThinking=false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;

    if (isThinking) {
        messageDiv.classList.add("thinking");
        messageDiv.innerHTML = `
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
        text.className = "text";

        text.innerHTML = ''; // Start empty for typing animation
        content.appendChild(text);
        messageDiv.appendChild(content);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

function typeMessage(messageDiv, message) {
    const textElement = messageDiv.querySelector('.text');
    let index = 0;

    // Process message for formatting
    let formattedMessage = message
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^(\d+)\.\s(.*)$/gm, '<li data-type="numbered">$2</li>')
        .replace(/^\*\s(.*)$/gm, '<li>$1</li>')
        .replace(/^>\s(.*)$/gm, '<blockquote>$1</blockquote>');

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
            setTimeout(typeChar, 20); // Adjust speed here (milliseconds per character)
        }
    }

    typeChar();
}


async function sendMessage(message) {
    addMessage(message, true);

    // Add thinking animation
    const thinkingMessage = addMessage("", false, true);

    try {
        const response = await apifree.chat(message);

        // Remove thinking animation
        thinkingMessage.remove();

        // Add AI message and start typing animation
        const aiMessage = addMessage("", false);
        typeMessage(aiMessage, response);
    } catch (err) {
        console.error(err);
        thinkingMessage.remove();
        const errorMessage = addMessage("", false);
        typeMessage(errorMessage, "⚠️ Sorry, something went wrong.");
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
    sendButton.disabled = userInput.value.trim() === "";
});

userInput.addEventListener("keypress", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
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

// Initial greeting
const greetingMessage = addMessage("", false);
typeMessage(greetingMessage, "👋 Hello! I am Brobits, Ask me anything!");