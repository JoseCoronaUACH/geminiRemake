let chatId = null; // Store the current chat session ID

// Function to create a new chat session
function createNewChat() {
    fetch("http://localhost:5000/new_chat", {
        method: "POST",
    })
    .then(response => response.json())
    .then(data => {
        chatId = data.chat_id;
        document.getElementById("chat-number").innerText = `Chat ${chatId}`;
        document.getElementById("chat-history").innerHTML = ""; // Clear chat history
        
        // Add the new chat to the sidebar immediately
        addChatToSidebar(chatId);
        
        // Also refresh the full chat list to ensure consistency
        loadChatList();
    });
}

// Helper function to add a single chat to the sidebar
function addChatToSidebar(id) {
    const chatList = document.getElementById("chat-list");
    const existingChat = Array.from(chatList.children).find(item => 
        item.innerText === `Chat ${id}`
    );
    
    if (!existingChat) {
        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");
        chatItem.innerText = `Chat ${id}`;
        chatItem.onclick = () => switchChat(id);
        chatList.insertBefore(chatItem, chatList.firstChild); // Add at the top
    }
}

// Rest of your functions remain the same, but update loadChatList:
function loadChatList() {
    fetch("http://localhost:5000/get_chats") // This endpoint should return all chat IDs
    .then(response => response.json())
    .then(data => {
        const chatList = document.getElementById("chat-list");
        chatList.innerHTML = ""; // Clear existing list
        
        // Sort chats by ID (newest first) and add to sidebar
        data.chats.sort((a, b) => b.id - a.id).forEach(chat => {
            addChatToSidebar(chat.id);
        });
        
        // Highlight the current chat
        highlightCurrentChat();
    });
}

function highlightCurrentChat() {
    const chatItems = document.querySelectorAll(".chat-item");
    chatItems.forEach(item => {
        item.classList.remove("active-chat");
        if (item.innerText === `Chat ${chatId}`) {
            item.classList.add("active-chat");
        }
    });
}

// Modify switchChat to highlight the selected chat
function switchChat(id) {
    chatId = id;
    document.getElementById("chat-number").innerText = `Chat ${chatId}`;
    document.getElementById("chat-history").innerHTML = ""; // Clear current chat history
    
    // Load history for the selected chat
    fetch(`http://localhost:5000/get_history?chat_id=${id}`)
    .then(response => response.json())
    .then(data => {
        data.history.forEach(message => {
            if (message.user) appendMessage(message.user, "user-message");
            if (message.bot) appendMessage(message.bot, "bot-message");
        });
        highlightCurrentChat(); // Update highlighting
    });
}

function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message || chatId === null) return;

    // Append the user message to the chat
    appendMessage(message, "user-message");

    // Send the user message to the backend
    fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message })
    })
    .then(response => response.json())
    .then(data => {
        // Append the bot response
        appendMessage(data.reply, "bot-message");
    })
    .catch(error => {
        console.error("Error sending message:", error);
        appendMessage("❌ Error connecting to server.", "bot-message");
    });

    // Clear the input field after sending
    input.value = "";
}

function appendMessage(text, className) {
    const container = document.getElementById("chat-history");
    const msg = document.createElement("div");
    msg.className = `chat-message ${className}`;
    
    // Parse Markdown if the message is from the bot
    if (className === "bot-message") {
        // Use marked.js to convert Markdown to HTML
        msg.innerHTML = marked.parse(text);  // Convert Markdown to HTML
    } else {
        msg.textContent = text;  // Use textContent to avoid injecting HTML in user messages
    }

    container.appendChild(msg);

    // Smooth scroll to the bottom of the chat
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100); // Small delay for smooth scrolling
}


window.addEventListener("load", () => {
    // Reset chats on page load
    fetch("http://localhost:5000/reset_chats", {
        method: "POST"
    })
    .then(() => {
        // Create first chat session after reset
        createNewChat();
    })
    .catch(err => {
        console.error("Failed to reset chats:", err);
    });
});
