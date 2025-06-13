import { useState } from 'react';

export default function ChatApp() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Bonjour ! Je suis ton IA d'évaluation en Design. Peux-tu me dire ce que tu sais sur le Design UX/UI ?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // ⚠️ Remplace l'URL ci-dessous par celle de ton backend Render ou Railway
    const res = await fetch('https://your-backend-api.com/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    const botReply = { sender: 'bot', text: data.reply };

    setMessages((prev) => [...prev, botReply]);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="h-[500px] overflow-y-auto p-4 space-y-2 bg-white shadow rounded-lg">
        {messages.map((msg, i) => (
          <div key={i} className={`text-${msg.sender === 'bot' ? 'left' : 'right'} mb-2`}>
            <span className={`inline-block p-2 rounded-lg ${msg.sender === 'bot' ? 'bg-gray-200' : 'bg-blue-200'}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Écris ta réponse..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
