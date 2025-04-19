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
    sendDocument,
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

  const lastFriendMessage = useMemo(() => {
    return messages
      .filter((msg) => msg.senderId !== authUser?._id)
      .slice(-1)[0]?.text || null;
  }, [messages, authUser?._id]);

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
    const containerRect = chatContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    const contextMenuHeight = senderId === authUser?._id ? 80 : 80;
    const contextMenuWidth = 150;

    const isSender = senderId === authUser?._id;
    const x = isSender
      ? Math.max(0, mouseX - containerRect.left - contextMenuWidth - 20)
      : Math.max(0, mouseX - containerRect.left + 20);
    const y = Math.max(0, mouseY - containerRect.top);

    setContextMenu({
      visible: true,
      x: Math.min(x, containerRect.width - contextMenuWidth),
      y: y + contextMenuHeight > containerRect.height ? y - contextMenuHeight : y,
      text: text || "",
      messageId,
      isSender,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contextMenu.text);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleDelete = () => {
    if (contextMenu.messageId) {
      deleteMessage(contextMenu.messageId);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleClickOutside = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleScroll = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleEvent = contextMenu.visible
      ? () => {
          document.addEventListener("click", handleClickOutside);
          document.addEventListener("scroll", handleScroll, true);
        }
      : () => {
          document.removeEventListener("click", handleClickOutside);
          document.removeEventListener("scroll", handleScroll, true);
        };
    handleEvent();

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu.visible]);

  return (
    <div className="flex-1 flex flex-col bg-white relative" ref={chatContainerRef}>
      <ChatHeader />
      <div className="flex-1 overflow-y-auto">
        {isMessagesLoading ? (
          <>
            <MessageSkeleton />
          </>
        ) : (
          <div className="p-4 space-y-4 pb-20">
            {messages.map((message) => {
              const isSender = message.senderId === authUser?._id;
              const isReceiver = message.receiverId === authUser?._id;
              const isScheduledAndFuture =
                message.isScheduled && new Date(message.scheduledAt) > new Date();

              if (isScheduledAndFuture && isReceiver) return null;

              const key = message._id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              console.log("Rendering message:", { ...message, key });

              return (
                <div
                  key={key}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                  ref={message === messages[messages.length - 1] ? messageEndRef : null}
                >
                  <div className="flex flex-col">
                    <time className="text-xs text-gray-500">
                      {formatMessageTime(
                        message.isScheduled ? message.scheduledAt : message.createdAt
                      )}
                    </time>
                    <div
                      className={`p-2 rounded-lg ${isSender ? "bg-blue-500 text-black" : "bg-gray-200 text-black"}`}
                      onContextMenu={(e) =>
                        handleRightClick(e, message.text || "", message._id, message.senderId)
                      }
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="max-w-[200px] rounded-md mb-2"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      {message.document && (
                        <a
                          href={message.document}
                          onClick={(e) => {
                            e.preventDefault();
                            const link = document.createElement("a");
                            link.href = message.document;
                            let downloadName = message.filename || 'unnamed_document';
                            downloadName = downloadName.replace(/^[\d_]+/, '').replace(/\s*\(\d+\)$/, '');
                            const extensionMatch = message.document.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
                            if (extensionMatch) {
                              downloadName = downloadName.replace(new RegExp(`\\.${extensionMatch[1]}$`, 'i'), '') + `.${extensionMatch[1]}`;
                            }
                            link.download = downloadName;
                            fetch(message.document)
                              .then(response => response.blob())
                              .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                link.href = url;
                                link.download = downloadName;
                                link.click();
                                window.URL.revokeObjectURL(url);
                              });
                            console.log("Forced download attempted for:", message.document, "with intended filename:", downloadName);
                          }}
                          className="text-bold-500 hover:underline mb-2 block"
                          onError={(e) => {
                            e.target.style.display = "none";
                            console.error("Document link error:", e);
                          }}
                        >
                          {message.filename || `Unnamed Document (${message.document.split('/').pop() || 'file'})`}
                        </a>
                      )}
                      {message.text && <p>{message.text}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MessageInput lastMessage={lastFriendMessage} />
      {contextMenu.visible && (
        <div
          className="absolute bg-white shadow-md rounded-md p-2"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            transform: "translateY(-50%)",
          }}
        >
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Copy
          </button>
          {contextMenu.isSender && (
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatContainer;