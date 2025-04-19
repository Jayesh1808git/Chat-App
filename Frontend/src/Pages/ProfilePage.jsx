import React, { useState } from 'react';
import { useAuthStore } from '../Store/useAuthStore';
import { Camera, Mail, User, Calendar, Shield } from "lucide-react";
import { motion } from 'framer-motion'; // Add this dependency for animations
import Compressor from 'compressorjs'

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Compress the image
    new Compressor(file, {
      quality: 0.6, // Adjust quality (0 to 1)
      maxWidth: 800, // Resize to max width
      maxHeight: 800, // Resize to max height
      success(compressedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = async () => {
          const base64image = reader.result;
          setSelectedImg(base64image);
          await updateProfile({ profilepic: base64image });
        };
      },
      error(err) {
        console.error("Compression error:", err);
        toast.error("Failed to compress image");
      },
    });
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pt-20 bg-white from-base-100 to-base-200">
      <motion.div 
        className="max-w-2xl mx-auto p-6 py-10"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white  p-8 space-y-8 border ">
          {/* Header */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Profile
            </h1>
            <p className="mt-2 text-base-content/70">Manage your personal information</p>
          </motion.div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={selectedImg || authUser.profilepic || "/avatar.png"}
                alt="Profile"
                className="size-36 rounded-full object-cover border-4 border-primary shadow-lg transition-all duration-300 group-hover:ring-4 group-hover:ring-primary/20"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-2 right-2
                  bg-primary hover:bg-primary-focus
                  p-3 rounded-full cursor-pointer
                  shadow-md transition-all duration-300
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-70" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </motion.div>
            <p className="text-sm text-base-content/60 italic">
              {isUpdatingProfile ? "Uploading your new avatar..." : "Click the camera to update"}
            </p>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-base-content/70 flex items-center gap-2" style={{ color: '#800080' }}>
                <User className="w-4 h-4" style={{ color: '#800080' }} />
                Full Name
              </div>
              <p className="px-4 py-3 bg-base-200 rounded-lg border border-base-300 shadow-sm text-base-content/90">
                {authUser?.fullname}
              </p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-sm text-base-content/70 flex items-center gap-2" style={{ color: '#800080' }}>
                <Mail className="w-4 h-4" style={{ color: '#800080' }} />
                Email Address
              </div>
              <p className="px-4 py-3 bg-base-200 rounded-lg border border-base-300 shadow-sm text-base-content/90">
                {authUser?.email}
              </p>
            </motion.div>
          </div>

          {/* Account Info */}
          <motion.div 
            className="bg-gradient-to-r from-base-200 to-base-300 rounded-xl p-6 shadow-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#800080' }}>
              <Shield className="w-5 h-5 inline-block" style={{ color: '#800080' }} /> Account Information
            </h2>
            <div className="space-y-4 text-sm">
              <motion.div 
                className="flex items-center justify-between py-2 border-b border-base-300/50"
                whileHover={{ x: 5 }}
              >
                <span className="flex items-center gap-2" style={{ color: '#800080' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#800080' }} />
                  Member Since
                </span>
                <span className="bg-base-100 px-3 py-1 rounded-full text-xs">
                  {authUser.createdAt?.split("T")[0]}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center justify-between py-2"
                whileHover={{ x: 5 }}
              >
                <span className="flex items-center gap-2" style={{ color: '#800080' }}>
                  <Shield className="w-4 h-4" style={{ color: '#800080' }} />
                  Account Status
                </span>
                <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;