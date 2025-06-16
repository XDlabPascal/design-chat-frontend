import os
import requests
from flask import Flask, request, jsonify
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@example.com")

app = Flask(__name__)

VIDEO_CATALOG = [
    {
        "title": "Principes de base de l'UI Design",
        "keywords": ["ui", "interface", "couleurs"],
        "url": "https://videos.example.com/ui-design-basics.mp4",
    },
    {
        "title": "Créer une interface cohérente avec Figma",
        "keywords": ["figma", "prototypage"],
        "url": "https://videos.example.com/figma-interface.mp4",
    },
    {
        "title": "Améliorer l'expérience utilisateur : 5 techniques avancées",
        "keywords": ["ux", "utilisateur", "experience"],
        "url": "https://videos.example.com/ux-advanced.mp4",
    },
]

def call_mistral(messages, temperature=0.7, max_tokens=512):
    headers = {"Authorization": f"Bearer {MISTRAL_API_KEY}"}
    payload = {
        "model": "mistral-large-latest",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    response = requests.post(MISTRAL_API_URL, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()

def generate_summary(conversation):
    summary_prompt = {
        "role": "system",
        "content": (
            "Tu es un tuteur pédagogique en Design. Tu viens de terminer une session "
            "d'évaluation des connaissances avec l'apprenant. Rédige :\n"
            "1. Un paragraphe résumant ses points forts et faibles.\n"
            "2. Une liste concise de 3 recommandations vidéo (titres seulement)."
        ),
    }
    summary_resp = call_mistral([summary_prompt, *conversation])
    return summary_resp["choices"][0]["message"]["content"]

def send_summary_email(to_email, summary_text):
    if not SENDGRID_API_KEY:
        raise RuntimeError("SENDGRID_API_KEY not configured")

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject="Votre synthèse de compétences en Design",
        html_content=summary_text.replace("\n", "<br>")
    )
    sg = SendGridAPIClient(SENDGRID_API_KEY)
    response = sg.send(message)
    return response.status_code

@app.route("/message", methods=["POST"])
def handle_message():
    data = request.get_json(force=True)
    user_msg = data.get("message", "")
    email = data.get("email")
    history = data.get("history", [])
    end_session = data.get("end", False)

    system_prompt = {
        "role": "system",
        "content": (
            "Tu es un évaluateur expert en Design (UX/UI, typographie, couleurs, prototypage). "
            "Pose des questions progressives pour évaluer le niveau de l'apprenant. "
            "Réponds en français, de façon bienveillante, une seule question à la fois. "
            "Si l'apprenant répond de façon vague, pose des questions de relance."
        ),
    }
    messages = [system_prompt, *history, {"role": "user", "content": user_msg}]
    bot_raw = call_mistral(messages)
    bot_reply = bot_raw["choices"][0]["message"]["content"]

    new_history = history + [{"role": "user", "content": user_msg}, {"role": "assistant", "content": bot_reply}]

    if end_session and email:
        summary_text = generate_summary(new_history)
        send_summary_email(email, summary_text)

    return jsonify({"reply": bot_reply, "history": new_history})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
