import ChatWindow from "./Components/ChatWindow";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <h1 className="text-center text-2xl font-bold p-4">💬 Real-Time Chat</h1>
      <ChatWindow />
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default App;
