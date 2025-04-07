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
    isUsersLoading 
  } = useChatStore();
  const { authUser, onlineUsers = [] } = useAuthStore(); // Added authUser
  
  // Initialize addedUsers from localStorage, excluding self
  const [addedUsers, setAddedUsers] = useState(() => {
    const savedUsers = localStorage.getItem("addedChatUsers");
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    return parsedUsers.filter(user => user._id !== authUser?._id); // Exclude self
  });
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Persist addedUsers to localStorage whenever it changes, excluding self
  useEffect(() => {
    const filteredUsers = addedUsers.filter(user => user._id !== authUser?._id);
    localStorage.setItem("addedChatUsers", JSON.stringify(filteredUsers));
  }, [addedUsers, authUser?._id]);

  // Filter users based on online status
  const filteredUsers = showOnlineOnly
    ? addedUsers.filter((user) => onlineUsers.includes(user._id))
    : addedUsers;

  // Improved search functionality, excluding self
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
        return user._id !== authUser?._id && // Exclude self
          queryWords.every((word) => {
            const nameWords = fullNameLower.split(/\s+/);
            return nameWords.some((nameWord) => nameWord.startsWith(word));
          }) && 
          !addedUsers.some(added => added._id === user._id); // Exclude already added users
      })
      .slice(0, 5); // Limit to 5 results

    setSearchResults(results);
  };

  // Add user to sidebar, with self-check
  const handleAddUser = (user) => {
    if (user._id === authUser?._id) {
      toast.error("Cannot add yourself as a contact!");
      return;
    }
    if (addedUsers.some(u => u._id === user._id)) {
      toast.error("User already added!");
      return;
    }
    setAddedUsers(prev => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
    toast.success(`${user.fullname} added to contacts!`);
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-white dark:bg-gray-800">
      {/* Header */}
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
          >
            <Plus className="size-5 text-primary" />
          </button>
        </div>
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
            ({onlineUsers.length - 1} online) {/* Adjusted to exclude self */}
          </span>
        </div>
      </div>

      {/* User List */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-base-content/50 py-4">
            No contacts added yet. Click the + button to add someone!
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

      {/* Search Modal */}
      {isSearchOpen && (
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

            {/* Search Results */}
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