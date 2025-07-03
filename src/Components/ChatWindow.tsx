import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import toast from "react-hot-toast";
import { SendOutlined } from '@ant-design/icons';

type Message = {
    sender: string;
    content: string;
    timestamp: string;
};

const ChatWindow: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState("");
    const [connectionStarted, setConnectionStarted] = useState(false);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const messageEndRef = useRef<HTMLDivElement | null>(null);


    const loadMessages = async () => {
        try {
            const res = await axios.get("http://localhost:5132/api/message");
            const data = res.data.result;
            const messageArray = Array.isArray(data) ? data : data.messages;

            if (Array.isArray(messageArray)) {
                setMessages(messageArray);
                console.log("✅ Messages loaded:", res.status);
            } else {
                console.error("❌ Expected array, got:", data);
            }
        } catch (err) {
            console.error("❌ Failed to fetch messages:", err);
        }
    };

    useEffect(() => {
        if (!username) return;

        sessionStorage.setItem("chat-username", username);

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5132/chathub")
            .withAutomaticReconnect()
            .build();

        connection
            .start()
            .then(() => {
                console.log("✅ SignalR connected");
                setConnectionStarted(true);
            })
            .catch((err) => console.error("❌ SignalR connection error:", err));

        connection.on("ReceiveMessage", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        connectionRef.current = connection;
        loadMessages();

        return () => {
            connection.stop();
        };
    }, [username]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    const sendMessage = async () => {
        if (!input.trim()) return;

        try {
            console.log("📤 Sending message:", input);
            await connectionRef.current?.invoke("SendMessage", username, input);
            setInput("");
            toast.success("Message sent")
        } catch (err) {
            console.error("❌ Error sending message:", err);
            toast.error("Failed to send message")
        }
    };

    if (!username) {
        return (
            <div className="max-w-sm mx-auto mt-20 p-6 bg-gradient-to-br from-blue-100 to-white shadow-2xl rounded-2xl border border-blue-200">
                <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
                    🚀 Start Chatting
                </h2>
                <input
                    type="text"
                    placeholder="👤 Enter your username"
                    className="w-full border border-blue-300 rounded-full px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-400 outline-none mb-4 transition"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const name = (e.target as HTMLInputElement).value.trim();
                            if (name) setUsername(name);
                            else toast.error("⚠️ Username cannot be empty", { id: "username-error" });
                        }
                    }}
                />
                <button
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-full hover:bg-blue-700 shadow-md transition"
                    onClick={() => {
                        const inputEl = document.querySelector(
                            'input[type="text"]'
                        ) as HTMLInputElement;
                        const name = inputEl?.value.trim();
                        if (name) setUsername(name);
                        else toast.error("⚠️ Username cannot be empty", { id: "username-error" });
                    }}
                >
                    ✅ Start Chat
                </button>
            </div>
        );

    }

    return (
        <div>
            <div className="max-w-xl mx-auto p-6 bg-gradient-to-br from-blue-100 to-white shadow-2xl rounded-3xl">
                <h2 className="text-2xl font-bold text-blue-700 text-center mb-4">
                    👋 Welcome, <span className="underline decoration-blue-500">{username}</span>
                </h2>

                <div className="bg-white shadow-inner rounded-2xl p-4 h-[70vh] overflow-y-auto mb-4 border border-blue-200">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="mb-3">
                            <div className="flex items-start gap-2">
                                <div className="bg-blue-100 px-3 py-2 rounded-xl shadow-md w-fit max-w-[80%]">
                                    <p className="text-sm text-blue-800 font-semibold">{msg.sender}</p>
                                    <p className="text-sm text-gray-800">{msg.content}</p>
                                </div>
                            </div>
                            <p className="text-xs text-right text-gray-400 pr-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    ))}
                    <div ref={messageEndRef} />
                </div>


                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 min-w-0 w-full max-w-full border border-blue-300 rounded-full px-4 py-2 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="Type your message..."
                    />

                    <button
                        onClick={sendMessage}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition h-full w-auto"
                    >
                        <SendOutlined />
                    </button>
                </div>
            </div>
        </div>

    );
};

export default ChatWindow;
