import { signIn, useSession, getSession } from "next-auth/react";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Invalid credentials");
    } else {
      console.log("cominggg")


      // Manually fetch the session again
      const updatedSession = await getSession();

      if (updatedSession?.user?.id) {
        toast.success("Login successful!");
        alert("login success")
        localStorage.setItem("userId", updatedSession.user.id);
      }

      router.push("/chat");
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <ToastContainer autoClose={2000} />
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-3xl font-bold mb-6 text-blue-400">Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border p-3 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border p-3 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`py-3 rounded-lg font-semibold transition-all ${loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Signup Button */}
        <p className="mt-4 text-gray-300">Don't have an account?</p>
        <button
          onClick={() => router.push("/signup")}
          className="mt-2 bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition-all"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
