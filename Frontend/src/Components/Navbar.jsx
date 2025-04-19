import { Link } from "react-router-dom";
import { useAuthStore } from "../Store/useAuthStore";
import { LogOut, MessageSquare, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-40 bg-opacity-90">
      <div className="container mx-auto px-4 h-12">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1 hover:opacity-80">
              <div className="w-8 h-8 bg-blue-600/10 flex items-center justify-center rounded">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <h1 className="text-lg font-bold text-gray-800">Chatty</h1>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {authUser && (
              <>
                <Link to="/profile" className="p-1 text-gray-600 hover:text-blue-600">
                  <User className="size-5" />
                </Link>
                <button className="p-1 text-gray-600 hover:text-blue-600" onClick={logout}>
                  <LogOut className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;