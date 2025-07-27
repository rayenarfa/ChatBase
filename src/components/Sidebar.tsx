import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFriends } from "../hooks/useFriends";
import { useChats } from "../hooks/useChats";
import { User, FriendRequest } from "../lib/supabase";
import {
  Users,
  MessageSquare,
  UserPlus,
  LogOut,
  User as UserIcon,
  Check,
  X,
  MoreVertical,
} from "lucide-react";
import { Button } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./ui/menu";

interface SidebarProps {
  activeTab: "friends" | "requests" | "chats";
  onTabChange: (tab: "friends" | "requests" | "chats") => void;
  onSelectChat: (chat: any) => void;
  onSelectFriend: (friend: User) => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  onSelectChat,
  onSelectFriend,
}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const {
    friends,
    friendRequests,
    respondToFriendRequest,
    removeFriend,
    blockUser,
  } = useFriends();
  const { chats } = useChats();

  const handleRespondToRequest = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      await respondToFriendRequest(requestId, status);
      toaster.create({
        title: `Friend request ${status}`,
        status: status === "accepted" ? "success" : "info",
        duration: 2000,
      });
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to respond to friend request",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      toaster.create({
        title: "Friend removed",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to remove friend",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await blockUser(userId);
      toaster.create({
        title: "User blocked",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to block user",
        status: "error",
        duration: 3000,
      });
    }
  };

  const getOtherChatMember = (chat: any) => {
    return chat.chat_members?.find(
      (member: any) => member.user_id !== profile?.id
    )?.users;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {profile?.name || "User"}
              </h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            size="sm"
            variant="ghost"
            colorScheme="gray"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          {
            id: "friends",
            label: "Friends",
            icon: Users,
            count: friends.length,
          },
          {
            id: "requests",
            label: "Requests",
            icon: UserPlus,
            count: friendRequests.filter(
              (r) => r.status === "pending" && r.receiver_id === profile?.id
            ).length,
          },
          {
            id: "chats",
            label: "Chats",
            icon: MessageSquare,
            count: chats.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "friends" && (
          <div className="p-4 space-y-2">
            {friends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No friends yet. Add some friends to get started!
              </p>
            ) : (
              friends.map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectFriend(friend)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {friend.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                  <MenuRoot>
                    <MenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem onClick={() => handleRemoveFriend(friend.id)}>
                        Remove Friend
                      </MenuItem>
                      <MenuItem onClick={() => handleBlockUser(friend.id)}>
                        Block User
                      </MenuItem>
                    </MenuContent>
                  </MenuRoot>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="p-4 space-y-2">
            {friendRequests.filter(
              (r) => r.status === "pending" && r.receiver_id === profile?.id
            ).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pending friend requests
              </p>
            ) : (
              friendRequests
                .filter(
                  (r) => r.status === "pending" && r.receiver_id === profile?.id
                )
                .map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.sender?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.sender?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<Check className="w-4 h-4" />}
                        onClick={() =>
                          handleRespondToRequest(request.id, "accepted")
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        leftIcon={<X className="w-4 h-4" />}
                        onClick={() =>
                          handleRespondToRequest(request.id, "rejected")
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        )}

        {activeTab === "chats" && (
          <div className="p-4 space-y-2">
            {chats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No chats yet. Start a conversation with a friend!
              </p>
            ) : (
              chats.map((chat) => {
                const otherMember = getOtherChatMember(chat);
                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectChat(chat)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {otherMember?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {otherMember?.email}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
