from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import fitz  # PyMuPDF
from dotenv import load_dotenv
import google.generativeai as genai

# === Load credentials and model ===
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

app = Flask(__name__, static_folder="static")
CORS(app)

# === Load CV text dynamically ===
def load_cv_text():
    try:
        doc = fitz.open("CV Jose.pdf")  # Assumes it's in the same directory
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        print("⚠️ Error loading CV:", e)
        return "No se pudo cargar el CV."

CV_TEXT = load_cv_text()

# === Prompt base using CV text ===
PROMPT_BASE = (
    "Responde como un agente de ventas profesional presentando el perfil de Jose Corona.\n"
    "Usa tono breve, emojis, y no respondas como asistente técnico.\n"
    f"{CV_TEXT}\n"
    "¿Qué te gustaría saber sobre Jose? 💬\n"
)

# === In-memory session ===
session = {"context": "", "started": False}

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/reset", methods=["POST"])
def reset():
    global session
    session = {"context": "", "started": False}
    return jsonify({"status": "ok"})

@app.route("/chat", methods=["POST"])
def chat():
    global session
    msg = request.get_json().get("message", "").strip()

    if not session["started"]:
        session["started"] = True
        return jsonify({"reply": "¡Hola! 👋 Soy el agente de Jose. ¿Qué te gustaría saber? 💬"})

    if not msg:
        return jsonify({"reply": "❌ Mensaje vacío."}), 400

    prompt = session["context"] + "\nUsuario: " + msg + "\nAgente: " + PROMPT_BASE
    response = model.generate_content(prompt)

    session["context"] = prompt + "\n" + response.text
    return jsonify({"reply": response.text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
