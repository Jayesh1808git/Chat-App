import { X } from "lucide-react";
import { useAuthStore } from "../Store/useAuthStore";
import { useChatStore } from "../Store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2 pt-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={selectedUser.profilepic || "/avatar.png"} alt={selectedUser.fullname} />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{selectedUser.fullname}</h3>
            <p className="text-xs text-gray-500">{onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}</p>
          </div>
        </div>
        <button onClick={() => setSelectedUser(null)}>
          <X className="text-gray-600 hover:text-gray-800" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;