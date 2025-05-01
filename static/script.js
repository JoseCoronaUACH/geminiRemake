let chatStarted = false;

function initChat() {
  fetch("/reset", {
    method: "POST"
  })
  .then(() => {
    sendMessage(""); // Sends a welcome message
  })
  .catch(err => {
    console.error("❌ Error al reiniciar la sesión:", err);
  });
}

function sendMessage(messageOverride = null) {
  const input = document.getElementById("userInput");
  const message = messageOverride !== null ? messageOverride : input.value.trim();
  if (!message && chatStarted) return; // Don't send empty message if chat has started

  if (message) {
    appendMessage(message, "user-message");
  }

  fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
  .then(res => res.json())
  .then(data => {
    chatStarted = true;
    appendMessage(data.reply, "bot-message");
  })
  .catch(err => {
    console.error("❌ Error al enviar mensaje:", err);
    appendMessage("❌ No se pudo contactar con el agente.", "bot-message");
  });

  if (input) input.value = "";
}

function toggleChat() {
  const mainContainer = document.querySelector('.main-container');
  const chatSection = document.querySelector('.chat-section');
  const toggleBtn = document.getElementById("toggleChat");

  chatSection.classList.toggle('hidden');
  mainContainer.classList.toggle('chat-hidden');

  // Update toggle button text
  if (chatSection.classList.contains("hidden")) {
    toggleBtn.textContent = "🗨️ Chat";
  } else {
    toggleBtn.textContent = "❌ Cerrar Chat";
  }
}

function appendMessage(text, className) {
  const container = document.getElementById("chat-history");
  const msg = document.createElement("div");
  msg.className = `chat-message ${className}`;
  msg.innerHTML = marked.parse(text); // Convert markdown to HTML
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight; // Scroll to the bottom
}

window.addEventListener("load", () => {
  initChat();

  const input = document.getElementById("userInput");
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});

// Handle toggle button visibility on page load
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleChat");
  const chatSection = document.querySelector(".chat-section");
  const mainContainer = document.querySelector(".main-container");

  // Add event listener to the toggle button
  toggleBtn.addEventListener("click", toggleChat);

  // Show chat by default on desktop, hide on mobile
  if (window.innerWidth > 768) {
    chatSection.classList.remove("hidden");
    mainContainer.classList.remove("chat-hidden");
  } else {
    chatSection.classList.add("hidden");
    mainContainer.classList.add("chat-hidden");
  }
});
