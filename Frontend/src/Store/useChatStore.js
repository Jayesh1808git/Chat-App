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

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId === selectedUser._id) {
        set({ messages: [...get().messages, newMessage] });
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