let chatStarted = false;

function initChat() {
  fetch("/reset", {
    method: "POST"
  })
  .then(() => {
    sendMessage(""); // Dispara la bienvenida
  })
  .catch(err => {
    console.error("❌ Error al reiniciar la sesión:", err);
  });
}

function sendMessage(messageOverride = null) {
  const input = document.getElementById("userInput");
  const message = messageOverride !== null ? messageOverride : input.value.trim();
  if (!message && chatStarted) return;

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

function appendMessage(text, className) {
  const container = document.getElementById("chat-history");
  const msg = document.createElement("div");
  msg.className = `chat-message ${className}`;
  msg.innerHTML = marked.parse(text);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

window.addEventListener("load", () => {
  initChat();
});
