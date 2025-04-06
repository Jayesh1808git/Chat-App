// useChatStore.jsx
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  sentiment: null,
  smartReply:null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    if (!userId || typeof userId !== "string" || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid userId in getMessages:", userId, new Error().stack); // Stack trace for debugging
      toast.error("Invalid user selected for messages");
      return;
    }


    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser || !selectedUser._id) {
      console.error("No valid selectedUser for sendMessage:", selectedUser);
      toast.error("Please select a user to send a message");
      return;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMessage = {
        ...res.data,
        createdAt: res.data.createdAt || new Date().toISOString(),
      };
      set({ messages: [...messages, newMessage] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },
  deleteMessage:async(messageId)=>{
    if (!messageId || typeof messageId !== "string" || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid messageId in deleteMessage:", messageId);
      toast.error("Invalid message ID");
      return;
    }
      try {
        await axiosInstance.delete(`/messages/delete/${messageId}`);
        const { messages } = get();
        set({ messages: messages.filter((msg) => msg._id !== messageId) });
        toast.success("Message deleted successfully");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete message");
      }
    
  },
  scheduleMessage: async (messageData, sendAt) => {
    const { selectedUser } = get();
    if (!selectedUser || !selectedUser._id) {
      console.error("No valid selectedUser for scheduleMessage:", selectedUser);
      toast.error("Please select a user to schedule a message");
      return;
    }

    try {
      const res = await axiosInstance.post(`/messages/schedule/${selectedUser._id}`, {
        text: messageData.text,
        image: messageData.image,
        sendAt: sendAt.toISOString(),
      });
      console.log("Scheduled message response:", res.data);
      // Add the scheduled message to the UI with a "Scheduled" indicator
      const scheduledMessage = {
        ...res.data.scheduledMessage,
        isScheduled: true,
        createdAt: new Date().toISOString(), // Use current time for UI display
      };
      set({ messages: [...get().messages, scheduledMessage] });
      return res.data;
    } catch (error) {
      console.error("Error scheduling message:", error.response?.data || error);
      throw error;
    }
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      console.log("New message received via socket:", newMessage);
      if (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id) {
        set({ messages: [...get().messages, newMessage] });
      }
    });
  
    socket.on("scheduledMessage", (message) => {
      const selectedUser = get().selectedUser;
      const isRelevant =
        message.senderId === selectedUser?._id ||
        message.receiverId === selectedUser?._id;
    
      if (isRelevant) {
        const now = new Date();
        const scheduledAt = new Date(message.scheduledAt);
    
        // Check if it's time to display the message
        if (!message.isScheduled || scheduledAt <= now) {
          set((state) => ({
            messages: [...state.messages, message],
          }));
        } else {
          // Optional: delay until scheduledAt
          const delay = scheduledAt - now;
          setTimeout(() => {
            set((state) => ({
              messages: [...state.messages, message],
            }));
          }, delay);
        }
      }
    });
    
  },
  



  unsubscribeFromMessages: () => {
    const socket = useAuthStore

.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },
  getSmartReply: async (text) =>{
    if (!text || typeof text !== "string") {
      toast.error("Please provide valid text for smart reply");
      return;
    }

    try {
      const res = await axiosInstance.post("/messages/smart_reply", { text });
      const Reply = res.data.suggestions[0];
      set({ smartReply: Reply});
      console.log("Smart reply response:", Reply);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get smart reply");
      set({ reply: null });
    }

  },

  analyzeSentiment: async (text) => {
    if (!text || typeof text !== "string") {
      toast.error("Please provide valid text to analyze");
      return;
    }

    try {
      const res = await axiosInstance.post("/messages/analyze_sentiment", { text });
      set({ sentiment: { label: res.data.label, score: res.data.score } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to analyze sentiment");
      set({ sentiment: null });
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },

  clearSentiment: () => set({ sentiment: null }),
  
}));