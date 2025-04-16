from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables (API key)
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

app = Flask(__name__, static_folder="static")
CORS(app)

# Store chat history for multiple chats
chat_sessions = {}
current_chat_number = 1

# Route to serve the index.html
@app.route("/")
def serve_index():
    return send_from_directory("static", "index.html")

# Create new chat session
@app.route("/new_chat", methods=["POST"])
def new_chat():
    global current_chat_number
    chat_id = current_chat_number
    chat_sessions[chat_id] = {"context": "", "history": []}
    current_chat_number += 1
    return jsonify({"chat_id": chat_id})

# Handle user message and generate response
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    chat_id = data.get("chat_id")
    user_input = data.get("message", "")

    if chat_id not in chat_sessions:
        return jsonify({"error": "Chat ID not found"}), 404

    context = chat_sessions[chat_id]["context"]
    full_input = context + "\nUser: " + user_input + "Give me you response with te README commands from github(This way i give style to your response dont add anything about license and Contributing just your response in that style)\nBot:"
    
    response = model.generate_content(full_input)

    chat_sessions[chat_id]["context"] = full_input + " " + response.text
    chat_sessions[chat_id]["history"].append({"user": user_input, "bot": response.text})

    return jsonify({"reply": response.text})

# Get history for a chat session
@app.route("/get_history")
def get_history():
    chat_id = request.args.get("chat_id", type=int)
    history = chat_sessions.get(chat_id, {}).get("history", [])
    return jsonify({"history": history})

# Get list of chat sessions
@app.route("/get_chats")
def get_chats():
    chats = [{"id": cid} for cid in chat_sessions.keys()]
    return jsonify({"chats": chats})

@app.route("/reset_chats", methods=["POST"])
def reset_chats():
    global chat_sessions, current_chat_number
    chat_sessions = {}
    current_chat_number = 1
    return jsonify({"status": "reset"})


if __name__ == "__main__":
    app.run(debug=True)
