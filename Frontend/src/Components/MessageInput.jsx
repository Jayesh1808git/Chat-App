import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../Store/useChatStore";
import { useAuthStore } from "../Store/useAuthStore";
import { Image, Send, X, FileText } from "lucide-react";

const MessageInput = ({ lastMessage }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const inputRef = useRef(null);
  const { authUser } = useAuthStore();
  const { sendMessage, sendDocument, selectedUser } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileInputRef.current && !fileInputRef.current.contains(event.target)) {
        setImagePreview(null);
      }
      if (documentInputRef.current && !documentInputRef.current.contains(event.target)) {
        setDocumentPreview(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("MessageInput authUser:", authUser);
    console.log("MessageInput selectedUser:", selectedUser);
  }, [authUser, selectedUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No file selected in handleDocumentChange");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    console.log("Selected document:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setDocumentPreview({ file, name: file.name });
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDocument = () => {
    setDocumentPreview(null);
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !documentPreview) {
      console.log("No content to send");
      return;
    }

    if (documentPreview) {
      if (!authUser || !authUser._id) {
        console.error("No valid authUser:", authUser);
        return;
      }
      if (!selectedUser || !selectedUser._id) {
        console.error("No valid selectedUser:", selectedUser);
        return;
      }
      if (!documentPreview.file || !(documentPreview.file instanceof File)) {
        console.error("No valid document file:", documentPreview);
        return;
      }

      console.log("Preparing to send document:", {
        name: documentPreview.file.name,
        size: documentPreview.file.size,
        type: documentPreview.file.type,
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });

      const formData = new FormData();
      formData.append("file", documentPreview.file);

      for (let [key, value] of formData.entries()) {
        console.log(`MessageInput FormData ${key}:`, value);
      }

      sendDocument(formData);
    } else {
      const messageData = { text: text.trim(), image: imagePreview };
      console.log("Sending message immediately:", messageData);
      sendMessage(messageData);
    }

    setText("");
    setImagePreview(null);
    setDocumentPreview(null);
  };

  return (
    <div className="p-4 w-full bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      {imagePreview && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      {documentPreview && (
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-700">{documentPreview.name} ({(documentPreview.file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button
              onClick={removeDocument}
              className="ml-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          id="message-input-field"
          ref={inputRef}
          type="text"
          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <button
          type="button"
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
        >
          <Image size={18} />
        </button>

        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          ref={documentInputRef}
          onChange={handleDocumentChange}
        />
        <button
          type="button"
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => documentInputRef.current?.click()}
          title="Upload Document"
        >
          <FileText size={18} />
        </button>

        <button
          type="submit"
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          disabled={!text.trim() && !imagePreview && !documentPreview}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;