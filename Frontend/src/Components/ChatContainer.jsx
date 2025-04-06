import { useChatStore } from "../Store/useChatStore";
import { useEffect, useRef, useState, useMemo } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeleton/MessageSkeleton";
import { useAuthStore } from "../Store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    deleteMessage,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    getSmartReply,
    smartReply,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
    messageId: null,
    isSender: false,
  });
  const chatContainerRef = useRef(null);
  const [showSmartReply, setShowSmartReply] = useState(false);

  // Ensure useMemo is always called
  const lastFriendMessage = useMemo(() => {
    return messages
      .filter((msg) => msg.senderId !== authUser._id)
      .slice(-1)[0]?.text || null;
  }, [messages, authUser._id]);

  useEffect(() => {
    if (!selectedUser?._id) {
      console.error("No valid selectedUser in ChatContainer:", selectedUser);
      return;
    }

    console.log("Fetching messages for userId:", selectedUser._id);
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleRightClick = (event, text, messageId, senderId) => {
    event.preventDefault();
    const { clientX: mouseX, clientY: mouseY } = event;
    const containerRect = chatContainerRef.current.getBoundingClientRect();
    const contextMenuHeight = senderId === authUser._id ? 80 : 80;
    const contextMenuWidth = 150;

    const isSender = senderId === authUser._id;
    const x = isSender
      ? mouseX - containerRect.left - contextMenuWidth - 20
      : mouseX - containerRect.left + 20;
    const y = mouseY - containerRect.top;

    setContextMenu({
      visible: true,
      x: Math.max(0, Math.min(x, containerRect.width - contextMenuWidth)),
      y: y + contextMenuHeight > containerRect.height ? y - contextMenuHeight : y,
      text,
      messageId,
      isSender,
    });
    setShowSmartReply(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contextMenu.text);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDelete = () => {
    if (contextMenu.messageId) {
      deleteMessage(contextMenu.messageId);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleGetSmartReply = () => {
    if (contextMenu.text) {
      getSmartReply(contextMenu.text);
      setShowSmartReply(true);
    }
  };

  const handleSmartReplyClick = () => {
    const messageInput = document.querySelector("#message-input-field");
    if (messageInput && smartReply) {
      messageInput.value = smartReply;
      messageInput.focus();
    }
    setContextMenu({ ...contextMenu, visible: false });
    setShowSmartReply(false);
  };

  const handleClickOutside = () => {
    setContextMenu({ ...contextMenu, visible: false });
    setShowSmartReply(false);
  };

  const handleScroll = () => {
    setContextMenu({ ...contextMenu, visible: false });
    setShowSmartReply(false);
  };

  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    } else {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu.visible]);

  // Use conditional rendering within JSX instead of early return
  return (
    <div className="flex-1 flex flex-col overflow-auto relative" ref={chatContainerRef}>
      <ChatHeader />
      {isMessagesLoading ? (
        <>
          <MessageSkeleton />
          <MessageInput lastMessage={null} />
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isSender = message.senderId === authUser._id;
              const isReceiver = message.receiverId === authUser._id;
              const isScheduledAndFuture = message.isScheduled && new Date(message.scheduledAt) > new Date();

              if (isScheduledAndFuture && isReceiver) return null;

              return (
                <div
                  key={message._id}
                  className={`chat ${isSender ? "chat-end" : "chat-start"}`}
                  ref={messageEndRef}
                >
                  <div className="chat-image avatar">
                    <div className="size-10 rounded-full border">
                      <img
                        src={
                          isSender
                            ? authUser.profilepic || "/avatar.png"
                            : selectedUser.profilepic || "/avatar.png"
                        }
                        alt="profile pic"
                      />
                    </div>
                  </div>
                  <div className="chat-header mb-1">
                    <time className="text-xs opacity-50 ml-1">
                      {formatMessageTime(message.isScheduled ? message.scheduledAt : message.createdAt)}
                    </time>
                  </div>
                  <div
                    className="chat-bubble flex flex-col"
                    onContextMenu={(e) => handleRightClick(e, message.text, message._id, message.senderId)}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                   
                  </div>
                </div>
              );
            })}
          </div>
          <MessageInput lastMessage={lastFriendMessage} />
        </>
      )}
      {contextMenu.visible && (
        <div
          className="absolute bg-white shadow-md rounded-md p-2 z-10"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: "translateY(-50%)",
          }}
        >
          <button
            onClick={handleCopy}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Copy
          </button>
          {!contextMenu.isSender && (
            <button
              onClick={handleGetSmartReply}
              className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
            >
              Smart Reply
            </button>
          )}
          {contextMenu.isSender && (
            <button
              onClick={handleDelete}
              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {contextMenu.visible && showSmartReply && smartReply && !contextMenu.isSender && (
        <div
          className="absolute bg-blue-100 border border-blue-300 rounded-md p-2 z-20 shadow-md"
          style={{
            top: `${contextMenu.y + 80 + 5}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <p
            className="text-blue-700 cursor-pointer hover:underline py-1"
            onClick={handleSmartReplyClick}
          >
            {smartReply}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;