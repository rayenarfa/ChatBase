import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useChats } from "../hooks/useChats";
import { useFriends } from "../hooks/useFriends";
import { User } from "../lib/supabase";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import AddFriendModal from "../components/AddFriendModal";
import { Button } from "@chakra-ui/react";
import { UserPlus } from "lucide-react";
import { createToast } from "../components/ui/toaster";

export default function ChatPage() {
  const { user, profile, updateProfile } = useAuth();
  const { selectedChat, setSelectedChat, createChat } = useChats();
  const { friends, refresh } = useFriends();
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "chats">(
    "friends"
  );
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  // Create user profile if it doesn't exist
  useEffect(() => {
    const createUserProfile = async () => {
      if (user && !profile) {
        try {
          const { error } = await supabase.from("users").insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
          });

          if (error && error.code !== "23505") throw error; // Ignore duplicate key errors
        } catch (error) {
          console.error("Error creating user profile:", error);
        }
      }
    };

    createUserProfile();
  }, [user, profile]);

  const handleSelectFriend = async (friend: User) => {
    try {
      const chat = await createChat(friend.id);
      if (chat) {
        setSelectedChat(chat);
        setActiveTab("chats");
      }
    } catch (error) {
      createToast({
        title: "Error",
        description: "Failed to create chat",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
  };

  const handleTabChange = (tab: "friends" | "requests" | "chats") => {
    setActiveTab(tab);
  };

  const handleAddFriendSuccess = () => {
    refresh();
    setActiveTab("requests");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSelectChat={handleSelectChat}
        onSelectFriend={handleSelectFriend}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Add Friend Button */}
        {activeTab === "friends" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Friends</h1>
              <Button
                onClick={() => setIsAddFriendModalOpen(true)}
                colorScheme="blue"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </div>
          </motion.div>
        )}

        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow selectedChat={selectedChat} />
        </div>
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />
    </div>
  );
}
