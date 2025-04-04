import { useRef, useState } from "react";
import { useChatStore } from "../Store/useChatStore";
import { Image, Send, X, Brain } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, analyzeSentiment, sentiment, isMessagesLoading, clearSentiment } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      setText("");
      setImagePreview(null);
      clearSentiment(); // Reset sentiment after sending a message
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleAnalyzeSentiment = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      await analyzeSentiment(text);
      if (sentiment) {
        toast.success(`Sentiment: ${sentiment.label} (${Math.abs(sentiment.score).toFixed(2)})`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInputBorderClass = () => {
    if (!sentiment || isMessagesLoading) return "border-gray-300 dark:border-gray-600";
    switch (sentiment.label) {
      case "positive":
        return "border-green-500 ring-2 ring-green-500/20";
      case "negative":
        return "border-red-500 ring-2 ring-red-500/20";
      case "neutral":
        return "border-yellow-500 ring-2 ring-yellow-500/20";
      default:
        return "border-gray-300 dark:border-gray-600";
    }
  };

  return (
    <div className="p-6 w-full bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-lg">
      {imagePreview && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-md"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/90
              flex items-center justify-center text-white hover:bg-red-600 transition-all"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
        <div className="flex-1 flex gap-3 items-center">
        <button
            type="button"
            onClick={handleAnalyzeSentiment}
            className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white
            hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnalyzing || !text.trim()}
          >
            {isAnalyzing ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Brain size={22} />
            )}
          </button>

          <input
            type="text"
            className={`w-full input rounded-xl py-6 pl-4 pr-4 transition-all duration-300 
            focus:ring-4 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-700 text-base
            ${getInputBorderClass()}`}
            placeholder="Type your message..."
            value={text}
            onBlur={clearSentiment} // Reset sentiment when input loses focus
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
            className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white
            hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={22} />
          </button>

          <button
            type="submit"
            className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white
            hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={22} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;