import { useEffect, useState } from "react";
import { useChatStore } from "../Store/useChatStore";
import { useAuthStore } from "../Store/useAuthStore";
import SidebarSkeleton from "./skeleton/SidebarSkeleton";
import { Users, Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { 
    getUsers, 
    users: allUsers, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    getMessages, // Fetch message history
    messages = [], // Access the messages state
    isMessagesLoading
  } = useChatStore();
  const { authUser, onlineUsers = [] } = useAuthStore();
  
  // Initialize addedUsers from localStorage
  const [addedUsers, setAddedUsers] = useState(() => {
    const savedUsers = localStorage.getItem("addedChatUsers");
    return savedUsers ? JSON.parse(savedUsers) : [];
  });
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Fetch users and messages when component mounts or auth changes
  useEffect(() => {
    getUsers();
    if (authUser && authUser._id) {
      getMessages(authUser._id).catch(error => {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load message history.");
      });
    }
  }, [getUsers, getMessages, authUser]);

  // Sync addedUsers with auth state changes (login/logout)
  useEffect(() => {
    if (authUser) {
      const savedUsers = localStorage.getItem("addedChatUsers");
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
      setAddedUsers(parsedUsers.filter(user => user._id !== authUser._id));
    } else {
      setAddedUsers([]);
      localStorage.removeItem("addedChatUsers");
    }
  }, [authUser]);

  // Persist addedUsers to localStorage when it changes
  useEffect(() => {
    if (authUser && addedUsers.length > 0) {
      const filteredUsers = addedUsers.filter(user => user._id !== authUser._id);
      localStorage.setItem("addedChatUsers", JSON.stringify(filteredUsers));
    }
  }, [addedUsers, authUser]);

  // Get users with messages from the database
  const usersWithMessages = allUsers.filter(user => 
    user._id !== authUser?._id && 
    messages.some(msg => 
      msg.sender === user._id || msg.receiver === user._id
    )
  ).filter(user => user !== undefined); // Ensure no undefined users

  // Combine manually added users with users from message history
  const allDisplayedUsers = [
    ...new Map([...addedUsers, ...usersWithMessages].map(user => [user._id, user])).values()
  ];

  // Filter based on online status
  const filteredUsers = showOnlineOnly
    ? allDisplayedUsers.filter((user) => onlineUsers.includes(user._id))
    : allDisplayedUsers;

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const queryWords = query.toLowerCase().trim().split(/\s+/);

    const results = allUsers
      .filter((user) => {
        const fullNameLower = user.fullname.toLowerCase();
        return user._id !== authUser?._id &&
          queryWords.every((word) => {
            const nameWords = fullNameLower.split(/\s+/);
            return nameWords.some((nameWord) => nameWord.startsWith(word));
          }) && 
          !allDisplayedUsers.some(added => added._id === user._id);
      })
      .slice(0, 5);

    setSearchResults(results);
  };

  const handleAddUser = (user) => {
    if (!authUser) {
      toast.error("Please log in to add contacts!");
      return;
    }
    if (user._id === authUser._id) {
      toast.error("Cannot add yourself as a contact!");
      return;
    }
    if (allDisplayedUsers.some(u => u._id === user._id)) {
      toast.error("User already displayed!");
      return;
    }
    setAddedUsers(prev => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
    toast.success(`${user.fullname} added to contacts!`);
  };

  if (isUsersLoading || isMessagesLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-white dark:bg-gray-800">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <span className="font-medium hidden lg:block text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Contacts
            </span>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="btn btn-ghost btn-circle hover:bg-base-200 transition-all hover:shadow-md"
            disabled={!authUser}
          >
            <Plus className="size-5 text-primary" />
          </button>
        </div>
        {authUser && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-base-content/50">
              ({onlineUsers.length - (authUser ? 1 : 0)} online)
            </span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {!authUser ? (
          <div className="text-center text-base-content/50 py-4">
            Please log in to view contacts
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-base-content/50 py-4">
            No contacts or message history yet. Click the + button to add someone!
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-200 transition-colors duration-200
                ${selectedUser?._id === user._id ? "bg-base-200 ring-1 ring-primary/20" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilepic || "/avatar.png"}
                  alt={user.fullname}
                  className="size-12 object-cover rounded-full border-2 border-primary/10 shadow-md"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-white dark:ring-gray-800"
                  />
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate text-base">{user.fullname}</div>
                <div className="text-sm text-base-content/60">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {isSearchOpen && authUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Add a Contact
              </h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="btn btn-ghost btn-circle"
              >
                <X className="size-5 text-base-content/70" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-primary/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="input input-bordered w-full pl-10 py-6 rounded-xl transition-all duration-300 
                focus:ring-4 focus:ring-primary/20 focus:border-primary"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleAddUser(user)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-base-200 rounded-xl transition-all"
                  >
                    <img
                      src={user.profilepic || "/avatar.png"}
                      alt={user.fullname}
                      className="size-10 object-cover rounded-full border border-primary/10"
                    />
                    <span className="font-medium">{user.fullname}</span>
                  </button>
                ))
              ) : (
                searchQuery && (
                  <div className="text-center text-base-content/50 py-4">
                    No users found
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;