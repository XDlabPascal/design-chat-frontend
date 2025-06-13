import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatApp() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Bonjour ! Je suis ton IA d'évaluation en Design. Peux-tu me dire ce que tu sais sur le Design UX/UI ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const res = await fetch("https://your-backend-api.com/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    const botReply = { sender: "bot", text: data.reply };

    setMessages((prev) => [...prev, botReply]);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card className="h-[500px] overflow-y-auto p-4 space-y-2">
        <CardContent>
          {messages.map((msg, i) => (
            <div key={i} className={`text-${msg.sender === "bot" ? "left" : "right"} mb-2`}>
              <span className={`block p-2 rounded-lg ${msg.sender === "bot" ? "bg-gray-200" : "bg-blue-200"}`}>
                {msg.text}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="mt-4 flex items-center gap-2">
        <Input
          placeholder="Écris ta réponse..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage} disabled={loading}>Envoyer</Button>
      </div>
    </div>
  );
}
