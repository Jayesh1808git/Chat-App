import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../Store/useChatStore";
import { Image, Send, X, Brain, Clock, Plus } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = ({ lastMessage }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [sendAt, setSendAt] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const optionsRef = useRef(null);
  const {
    sendMessage,
    analyzeSentiment,
    sentiment,
    scheduleMessage,
    isMessagesLoading,
    clearSentiment,
    smartReply,
    getSmartReply,
  } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    const handleScroll = () => {
      setShowOptions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyzeSentiment = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }
    setIsAnalyzing(true);
    setShowOptions(false);
    try {
      await analyzeSentiment(text);
      if (sentiment) {
        toast.success(`Sentiment: ${sentiment.label} (${Math.abs(sentiment.score).toFixed(2)})`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendOrScheduleMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) {
      console.log("No content to send or schedule");
      return;
    }

    const messageData = { text: text.trim(), image: imagePreview };
    console.log("Attempting to", isScheduling ? "schedule" : "send", "message. Data:", messageData, "SendAt:", sendAt);

    try {
      if (isScheduling) {
        if (!sendAt) {
          toast.error("Please select a date and time to schedule");
          console.log("No sendAt provided");
          return;
        }
        const now = new Date();
        if (sendAt < now) {
          toast.error("Scheduled time cannot be in the past");
          console.log("Selected time is in the past:", sendAt, "vs Now:", now);
          return;
        }
        console.log("Scheduling request payload:", { ...messageData, sendAt: sendAt.toISOString() });
        const response = await scheduleMessage(messageData, sendAt);
        console.log("Schedule response:", response);
        toast.success("Message scheduled successfully");
      } else {
        console.log("Sending message immediately:", messageData);
        await sendMessage(messageData);
        toast.success("Message sent successfully");
      }
      setText("");
      setImagePreview(null);
      setSendAt(null);
      setIsScheduling(false);
      clearSentiment();
      useChatStore.setState({ smartReply: null });
    } catch (error) {
      console.error("Error in handleSendOrScheduleMessage:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to process message");
    }
  };

  const toggleScheduling = () => {
    setIsScheduling(!isScheduling);
    setShowOptions(false);
    if (!isScheduling) setSendAt(null);
    console.log("Toggled scheduling to:", !isScheduling);
  };

  const handleDateTimeChange = (e) => {
    const value = e.target.value;
    const newSendAt = value ? new Date(value) : null;
    setSendAt(newSendAt);
    console.log("Selected sendAt:", newSendAt);
  };

  const formatDateTimeForInput = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const handleSmartReplyClick = () => {
    if (smartReply) {
      setText(smartReply);
      inputRef.current.focus();
      useChatStore.setState({ smartReply: null });
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
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-600 transition-all"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendOrScheduleMessage} className="flex flex-col gap-3">
        {smartReply && (
          <div className="mb-2">
            <button
              type="button"
              onClick={handleSmartReplyClick}
              className="btn bg-blue-500 text-white hover:bg-blue-600 rounded-xl px-4 py-2 transition-all"
            >
              {smartReply}
            </button>
          </div>
        )}

        <div className="flex-1 flex gap-3 items-center relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1"
            >
              <Plus size={22} />
            </button>

            {showOptions && (
              <div ref={optionsRef} className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 flex flex-col gap-2 z-10">
                <button
                  type="button"
                  onClick={handleAnalyzeSentiment}
                  className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAnalyzing || !text.trim()}
                >
                  {isAnalyzing ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Brain size={22} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleScheduling}
                  className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1"
                >
                  <Clock size={22} />
                </button>
              </div>
            )}
          </div>

          <input
            id="message-input-field"
            ref={inputRef}
            type="text"
            className={`w-full input rounded-xl py-6 pl-4 pr-4 transition-all duration-300 focus:ring-4 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-700 text-base ${getInputBorderClass()}`}
            placeholder="Type your message..."
            value={text}
            onBlur={clearSentiment}
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
            className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={22} />
          </button>

          <button
            type="submit"
            className="btn btn-circle bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:-translate-y-1"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={22} />
          </button>
        </div>

        {isScheduling && (
          <div className="mt-2">
            <input
              type="datetime-local"
              value={formatDateTimeForInput(sendAt)}
              onChange={handleDateTimeChange}
              className="w-full input rounded-xl py-2 pl-4 bg-gray-50 dark:bg-gray-700 text-base focus:ring-4 focus:ring-primary/20 focus:border-primary"
              min={formatDateTimeForInput(new Date())}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;