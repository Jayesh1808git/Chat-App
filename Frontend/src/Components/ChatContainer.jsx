import { useChatStore } from "../Store/useChatStore";
import { useEffect, useRef, useState, useMemo } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeleton/MessageSkeleton";
import { useAuthStore } from "../Store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Paperclip } from "lucide-react";
import toast from "react-hot-toast";

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
  const [showSmartReply, setShowSmartReply] = useState(false);

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
    setShowSmartReply(false);
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
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setShowSmartReply(false);
  };

  const handleClickOutside = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setShowSmartReply(false);
  };

  const handleScroll = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setShowSmartReply(false);
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
                  className={`chat ${isSender ? "chat-end" : "chat-start"}`}
                  ref={message === messages[messages.length - 1] ? messageEndRef : null}
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
                        onError={(e) => {
                          e.target.src = "/avatar.png";
                        }}
                      />
                    </div>
                  </div>
                  <div className="chat-header mb-1">
                    <time className="text-xs opacity-50 ml-1">
                      {formatMessageTime(
                        message.isScheduled ? message.scheduledAt : message.createdAt
                      )}
                    </time>
                  </div>
                  <div
                    className="chat-bubble flex flex-col"
                    onContextMenu={(e) =>
                      handleRightClick(e, message.text || "", message._id, message.senderId)
                    }
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
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
                          // Force the original filename, overriding any Cloudinary default
                          let downloadName = message.filename || 'default_document';
                          // Ensure no timestamp or suffix creeps in
                          downloadName = downloadName.replace(/^[\d_]+/, '').replace(/\s*\(\d+\)$/, '');
                          // Add extension from the original document URL
                          const extensionMatch = message.document.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
                          if (extensionMatch) {
                            downloadName = downloadName.replace(new RegExp(`\\.${extensionMatch[1]}$`, 'i'), '') + `.${extensionMatch[1]}`;
                          }
                          link.download = downloadName;
                          // Force the download with a Blob to bypass header issues
                          fetch(message.document)
                            .then(response => response.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              link.href = url;
                              link.download = downloadName;
                              link.click();
                              window.URL.revokeObjectURL(url);
                            })
                            .catch(error => console.error("Download error:", error));
                          console.log("Forced download attempted for:", message.document, "with intended filename:", downloadName);
                        }}
                        className="text-blue-500 hover:underline mb-2"
                        onError={(e) => {
                          e.target.style.display = "none";
                          console.error("Document link error:", e);
                        }}
                      >
                        {message.filename || "Download Document"}
                      </a>
                    )}
                    {message.text && <p>{message.text}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 p-4 bg-base-100 border-t border-base-200">
            <label
              htmlFor="document-upload"
              className="p-2 bg-primary hover:bg-primary-focus rounded-full cursor-pointer"
            >
              <Paperclip className="w-5 h-5 text-white" />
              <input
                type="file"
                id="document-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("file", file);
                    sendDocument(formData)
                      .then(() => {
                        toast.success("Document sent successfully");
                        getMessages(selectedUser._id);
                      })
                      .catch((error) =>
                        toast.error(error.response?.data?.message || "Failed to send document")
                      );
                  }
                }}
              />
            </label>
            <MessageInput lastMessage={lastFriendMessage} />
          </div>
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
      {contextMenu.visible &&
        showSmartReply &&
        smartReply &&
        !contextMenu.isSender && (
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