import { useChatStore } from "../Store/useChatStore";
import { useEffect, useRef, useState } from "react";
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
    const contextMenuHeight = 80;
    const contextMenuWidth = 100;

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
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contextMenu.text);
    setContextMenu({ ...contextMenu, visible: false });
    alert("Text copied to clipboard");
  };

  const handleDelete = () => {
    if (contextMenu.messageId) {
      deleteMessage(contextMenu.messageId);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleClickOutside = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleScroll = () => {
    setContextMenu({ ...contextMenu, visible: false });
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

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto relative" ref={chatContainerRef}>
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isSender = message.senderId === authUser._id;
          const isReceiver = message.receiverId === authUser._id;
          const isScheduledAndFuture = message.isScheduled && new Date(message.scheduledAt) > new Date();

          // Hide future scheduled messages from the receiver
          if (isScheduledAndFuture && isReceiver) return null;

          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
              onContextMenu={(e) => handleRightClick(e, message.text, message._id, message.senderId)}
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
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
                {isSender && (
  <>
                  {message.isScheduled && !message.isSent && (
                    <span className="text-xs text-yellow-500 mt-1">Scheduled</span>
                  )}
                  {message.isScheduled && message.isSent && (
                    <span className="text-xs text-yellow-500 mt-1">Message Sent</span>
                  )}
                </>
              )}
                
              </div>
            </div>
          );
        })}
      </div>

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

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
