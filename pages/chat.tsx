import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      router.push("/login"); // Redirect to login page if userId is missing
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/history?userId=${userId}`);
        const data = await response.json();

        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchMessages();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const newMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setLoading(true); // Start loading

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: input }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "ai", content: data.message },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setLoading(false); // Stop loading
    setInput("");
  };

  const handleDownload = () => {
    const lastAiMessage = messages.filter((msg) => msg.role === "ai").pop();
    if (!lastAiMessage) return;

    const blob = new Blob([lastAiMessage.content], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "generated-page.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
      <div className="flex flex-col flex-1 p-4 border rounded-lg bg-gray-900 shadow-lg overflow-y-auto">
        <div className="flex-1 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl max-w-xs text-sm shadow-md transition-all duration-300 ease-in-out ${
                msg.role === "user"
                  ? "bg-blue-600 text-white self-end"
                  : "bg-gray-700 text-gray-200 self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="p-3 bg-gray-700 text-gray-200 rounded-xl max-w-xs self-start animate-pulse">
              Generating...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex p-3 bg-gray-800 rounded-lg shadow-lg mt-4">
          <input
            type="text"
            className="flex-1 p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="ml-3 px-5 py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition-all"
          >
            Send
          </button>
        </form>
      </div>

      {messages.some((msg) => msg.role === "ai") && (
        <div className="ml-6 w-1/3 p-5 bg-gray-800 rounded-lg shadow-xl flex flex-col">
          <h2 className="text-lg font-bold mb-3 text-blue-400">Live Preview</h2>
          <iframe
            className="flex-1 w-full border rounded-lg shadow-md"
            srcDoc={messages.filter((msg) => msg.role === "ai").pop()?.content}
            title="Live Preview"
          />
          <button
            className="mt-3 px-6 py-3 bg-green-500 rounded-lg text-white font-semibold hover:bg-green-600 transition-all"
            onClick={handleDownload}
          >
            Download HTML
          </button>
        </div>
      )}
    </div>
  );
}
