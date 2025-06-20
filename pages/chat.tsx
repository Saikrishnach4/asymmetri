import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const inputRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      router.push("/");
    }
  }, []);
  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollButton(!entry.isIntersecting),
      { threshold: 0.5 }
    );

    if (inputRef.current) observer.observe(inputRef.current);

    return () => {
      if (inputRef.current) observer.unobserve(inputRef.current);
    };
  }, []);
  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/history?userId=${userId}`);
        const data = await response.json();
        console.log(data)
        if (data) {
          const formattedMessages = data.flatMap((msg: any) => [
            { role: "user", content: msg.message },
            { role: "ai", content: msg.response }
          ]);


          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    fetchMessages();
  }, [userId, messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const newMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: input }),
      });
      const data = await response.json();
      if (data.response) {
        setMessages((prevMessages) => [...prevMessages, { role: "ai", content: data.response }]);
        setTimeout(scrollToInput, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setLoading(false);
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
    <div className="flex h-screen bg-gray-900 text-white p-6 relative">
      {showScrollButton && (
        <button
          onClick={scrollToInput}
          className="fixed top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-2xl shadow-lg z-50 animate-bounce"
          title="Scroll to input"
        >
          ↓
        </button>
      )}

      {session && (
        <button
          onClick={() => {
            localStorage.removeItem("userId");
            signOut({ redirect: false }).then(() => {
              router.push("/");
            });
          }}
          className="absolute top-4 right-4 bg-red-500 px-5 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg"
        >
          Logout
        </button>
      )}

      <div className="flex flex-col flex-1 p-4 border rounded-lg bg-gray-800 shadow-lg overflow-y-auto">
        <div className="flex-1 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl max-w-xs text-sm shadow-md transition-all duration-300 ease-in-out ${msg.role === "user" ? "bg-blue-600 text-white self-end" : "bg-gray-700 text-gray-200 self-start"
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

        <form ref={inputRef} onSubmit={handleSubmit} className="flex p-3 bg-gray-800 rounded-lg shadow-lg mt-4">
          <input
            type="text"
            className="flex-1 p-3 rounded-lg text-white bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            srcDoc={messages.filter((msg) => msg.role === "ai").slice(-1)[0]?.content}

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
