import { useEffect, useState } from "react";
import { useChatStore } from "../Store/useChatStore";
import { useAuthStore } from "../Store/useAuthStore";
import SidebarSkeleton from "./skeleton/SidebarSkeleton";
import { Users, Plus, Search, X } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users: allUsers, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    getMessages, 
    messages = [], 
    isMessagesLoading
  } = useChatStore();
  const { authUser, onlineUsers = [] } = useAuthStore();
  
  const [addedUsers, setAddedUsers] = useState(() => {
    if (!authUser || !authUser._id) return [];
    const userContactsKey = `addedChatUsers_${authUser._id}`;
    const savedUsers = localStorage.getItem(userContactsKey);
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    getUsers();
    if (authUser && authUser._id) {
      getMessages(authUser._id);
    }
  }, [getUsers, getMessages, authUser]);

  useEffect(() => {
    if (authUser && authUser._id) {
      const userContactsKey = `addedChatUsers_${authUser._id}`;
      const savedUsers = localStorage.getItem(userContactsKey);
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
      setAddedUsers(parsedUsers.filter(user => user._id !== authUser._id));
    } else {
      setAddedUsers([]);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser && authUser._id) {
      const userContactsKey = `addedChatUsers_${authUser._id}`;
      const filteredUsers = addedUsers.filter(user => user._id !== authUser._id);
      localStorage.setItem(userContactsKey, JSON.stringify(filteredUsers));
    }
  }, [addedUsers, authUser]);

  const usersWithMessages = allUsers.filter(user => 
    user._id !== authUser?._id && 
    messages.some(msg => 
      msg.sender === user._id || msg.receiver === user._id
    )
  ).filter(user => user !== undefined);

  const allDisplayedUsers = [
    ...new Map([...addedUsers, ...usersWithMessages].map(user => [user._id, user])).values()
  ];

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
    if (!authUser) return;
    if (user._id === authUser._id) return;
    if (allDisplayedUsers.some(u => u._id === user._id)) return;
    setAddedUsers(prev => [...prev, user]);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  if (isUsersLoading || isMessagesLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-64 border-r border-gray-200 bg-white flex flex-col pt-4 ">
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-blue-600" />
            <span className="font-medium hidden lg:block text-lg text-gray-800">Contacts</span>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="btn btn-ghost btn-circle hover:bg-gray-100"
            disabled={!authUser}
          >
            <Plus className="size-5 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto py-2">
        {!authUser ? (
          <div className="text-center text-gray-500 py-2">Please log in</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-2">No contacts yet. Add someone!</div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-2 flex items-center gap-2 hover:bg-gray-100
                ${selectedUser?._id === user._id ? "bg-gray-100" : ""}
              `}
            >
              <div className="relative">
                <img
                  src={user.profilepic || "/avatar.png"}
                  alt={user.fullname}
                  className="w-10 rounded-full border border-gray-200"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-medium text-gray-800 truncate">{user.fullname}</div>
                <div className="text-xs text-gray-500">{onlineUsers.includes(user._id) ? "Online" : "Offline"}</div>
              </div>
            </button>
          ))
        )}
      </div>

      {isSearchOpen && authUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Add Contact</h3>
              <button onClick={() => setIsSearchOpen(false)} className="btn btn-ghost btn-circle">
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="input w-full pl-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleAddUser(user)}
                    className="w-full p-2 flex items-center gap-2 hover:bg-gray-100 rounded-md"
                  >
                    <img
                      src={user.profilepic || "/avatar.png"}
                      alt={user.fullname}
                      className="w-8 rounded-full border border-gray-200"
                    />
                    <span className="font-medium text-gray-800">{user.fullname}</span>
                  </button>
                ))
              ) : (
                searchQuery && (
                  <div className="text-center text-gray-500 py-1">No users found</div>
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