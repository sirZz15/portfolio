// Display a welcome message in the browser console
console.log("Welcome to Zoren P. Mabunga's portfolio!");
const sessionId = sessionStorage.getItem("chatbot_session") || crypto.randomUUID();
sessionStorage.setItem("chatbot_session", sessionId);
// Function to toggle the chatbot's visibility
function toggleChat() {
    const chatContainer = document.getElementById("chat-container");
    const hoverText = document.getElementById("hover-text"); // Select hover text
    const isVisible = chatContainer.style.display === "block";
    chatContainer.style.display = isVisible ? "none" : "block";

    // Hide hover text when the chatbot is clicked
    hoverText.style.display = "none";

    // Show introduction message when the chatbot is opened
    if (!isVisible) {
        const chatlog = document.getElementById("chatlog");
        if (!chatlog.innerHTML) {
            chatlog.innerHTML += `
                <div class="chat-message ai-message">
                    <img src="assets/chatbotlogo.png" alt="Chatbot Logo" class="chatbot-logo">
                    <span>Hi! I am Zoren’s AI Agent. Ask me anything about Zoren.</span>
                </div>
            `;
            scrollToBottom(); // Ensure the message is visible
        }
    }
}

// Ensure the chat log scrolls to the bottom for new messages
function scrollToBottom() {
    const chatlog = document.getElementById("chatlog");
    chatlog.scrollTop = chatlog.scrollHeight;
}

// Function to send the chat
function sendChat() {
    const chatInput = document.getElementById("chat-input");
    const query = chatInput.value.trim(); // Trim whitespace
    if (!query) return; // Prevent sending empty requests

    const chatlog = document.getElementById("chatlog");
    // Add user message with icon
    chatlog.innerHTML += `
        <div class="chat-message user-message">
            <img src="assets/humanicon.png" alt="User Icon" class="user-icon">
            <span>${query}</span>
        </div>
    `;

    // Make the POST request to the backend
    fetch("https://zorenmabunga.app.n8n.cloud/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sessionId: sessionId, 
            chatInput: query
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Replace "AI Assistant" with chatbot image
            const botMessage = `
                <div class="chat-message ai-message">
                    <img src="assets/chatbotlogo.png" alt="Chatbot Logo" class="chatbot-logo">
                    <span>${data.output}</span>
                </div>`;
            chatlog.innerHTML += botMessage;
            scrollToBottom(); // Auto-scroll to the latest message
        })
        .catch((error) => {
            // Display errors in the chatlog
            chatlog.innerHTML += `
                <div class="chat-message ai-message">
                    <img src="assets/chatbotlogo.png" alt="Chatbot Logo" class="chatbot-logo">
                    <span>Sorry, something went wrong: ${error.message}</span>
                </div>`;
            console.error("Fetch Error:", error);
            scrollToBottom(); // Auto-scroll to the latest message
        });

    chatInput.value = ""; // Clear input field
}

// Add event listener for the Enter key
document.getElementById("chat-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendChat();
    }
});

// Add event listener for the "Send" button
document.getElementById("send-button").addEventListener("click", sendChat);

// Show hover text
function showHoverText() {
    const hoverText = document.getElementById("hover-text");
    hoverText.style.display = "block"; // Make the hover text visible
}

// Hide hover text
function hideHoverText() {
    const hoverText = document.getElementById("hover-text");
    hoverText.style.display = "none"; // Hide the hover text
}
