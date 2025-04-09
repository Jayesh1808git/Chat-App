import Navbar from "./Components/Navbar";

import HomePage from "./Pages/HomePage";
import SignUpPage from "./Pages/SignUpPage";
import LoginPage from "./Pages/LoginPage";
<<<<<<< HEAD
=======

>>>>>>> 8d0cfced01843a8ee32a47614ad23d90ca0dcc6d
import ProfilePage from "./Pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./Store/useAuthStore";
<<<<<<< HEAD
=======

>>>>>>> 8d0cfced01843a8ee32a47614ad23d90ca0dcc6d
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
<<<<<<< HEAD
=======
      
>>>>>>> 8d0cfced01843a8ee32a47614ad23d90ca0dcc6d
      <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
    </Routes>
    <Toaster />
  </div>

  );
};
export default App;