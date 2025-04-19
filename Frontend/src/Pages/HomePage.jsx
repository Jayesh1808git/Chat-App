import { useChatStore } from "../Store/useChatStore";
import Sidebar from "../Components/SideBar";
import NoChatSelected from "../Components/NoChatSelected";
import ChatContainer from "../Components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-gray-100">
      <div className="flex items-center justify-center h-full ">
        <div className="bg-white rounded-lg shadow-md w-full  h-[calc(100vh-4rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;