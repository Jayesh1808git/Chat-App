// MessageInput.jsx
import { useRef, useState, useEffect } from 'react';
import { useChatStore } from '../Store/useChatStore';
import { useAuthStore } from '../Store/useAuthStore';
import { Image, Send, X, FileText } from 'lucide-react';

const MessageInput = ({ lastMessage }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const { authUser } = useAuthStore();
  const { sendMessage, sendDocument, selectedUser } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview({ file, url: reader.result });
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: PDF, DOC, DOCX, TXT');
      return;
    }
    setDocumentPreview({ file, name: file.name });
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDocument = () => {
    setDocumentPreview(null);
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('handleSendMessage triggered', { text, imagePreview, documentPreview });
    setError(null);

    if (!text.trim() && !imagePreview && !documentPreview) {
      console.log('No content to send');
      setError('No content to send');
      return;
    }

    // Ensure senderId and receiverId are strings
    const senderId = authUser?._id?.toString();
    const receiverId = selectedUser?._id?.toString();

    if (!senderId || !receiverId) {
      console.error('Invalid authUser or selectedUser:', { authUser, selectedUser });
      setError('User authentication error');
      return;
    }

    try {
      if (imagePreview || documentPreview) {
        const formData = new FormData();
        formData.append('file', imagePreview?.file || documentPreview?.file);
        formData.append('senderId', senderId);
        formData.append('receiverId', receiverId);
        if (text.trim()) formData.append('text', text.trim());
        console.log('Sending FormData:', [...formData.entries()]);
        const response = await sendDocument(formData);
        console.log('sendDocument response:', response);
      } else {
        const messageData = { text: text.trim() };
        console.log('Sending text message:', messageData);
        await sendMessage(messageData);
      }
      setText('');
      setImagePreview(null);
      setDocumentPreview(null);
    } catch (error) {
      console.error('Send error:', error.response?.data || error.message);
      setError(error.response?.data?.error || error.message || 'Failed to send message');
    }
  };

  return (
    <div className="p-4 w-full bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {imagePreview && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview.url}
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
            <span className="text-sm text-gray-700">
              {documentPreview.name} ({(documentPreview.file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
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