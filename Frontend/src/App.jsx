import Navbar from "./Components/Navbar";

import HomePage from "./Pages/HomePage";
import SignUpPage from "./Pages/SignUpPage";
import LoginPage from "./Pages/LoginPage";
import ProfilePage from "./Pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./Store/useAuthStore";

import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth,onlineUsers } = useAuthStore();


let online=onlineUsers.length;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });
  console.log({online});

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (

  <div>
    <Navbar />
    <Routes>
      <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
      <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
      <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
    </Routes>
    <Toaster />
  </div>

  );
};
export default App;