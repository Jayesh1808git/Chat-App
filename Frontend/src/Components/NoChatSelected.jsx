import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-8 bg-white/80">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Welcome to Chatty!</h2>
        <p className="text-gray-500">Select a conversation from the sidebar to start chatting</p>
      </div>
    </div>
  );
};

export default NoChatSelected;