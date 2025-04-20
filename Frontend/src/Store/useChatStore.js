import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/messages/users');
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (userId) => {
    if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid userId in getMessages:', userId, new Error().stack);
      toast.error('Invalid user selected for messages');
      return;
    }
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch messages');
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser || !selectedUser._id) {
      console.error('No valid selectedUser for sendMessage:', selectedUser);
      toast.error('Please select a user to send a message');
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
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  },
  sendDocument: async (formData) => {
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!authUser?._id || !selectedUser?._id || !formData.has('file')) {
      console.error('Invalid input for sendDocument:', { authUser, selectedUser, formData: [...formData.entries()] });
      throw new Error('Invalid input for sendDocument');
    }
    console.log('Sending document FormData:', [...formData.entries()]);
    try {
      const res = await axiosInstance.post('/messages/send-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('sendDocument response:', res.data);
      const newMessage = {
        ...res.data,
        createdAt: res.data.createdAt || new Date().toISOString(),
      };
      set((state) => ({ messages: [...state.messages, newMessage] }));
      return res.data;
    } catch (error) {
      console.error('sendDocument error:', error.response?.data || error.message);
      throw error;
    }
  },


  deleteMessage: async (messageId) => {
    if (!messageId || typeof messageId !== 'string' || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid messageId in deleteMessage:', messageId);
      toast.error('Invalid message ID');
      return;
    }
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      const { messages } = get();
      set({ messages: messages.filter((msg) => msg._id !== messageId) });
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  },

  

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on('newMessage', (newMessage) => {
      console.log('New message received via socket:', newMessage);
      if (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id) {
        set({ messages: [...get().messages, newMessage] });
      }
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off('newMessage');
    }
  },
  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },
}));