import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useChats } from "../hooks/useChats";
import { Message, User } from "../lib/supabase";
import { Send, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./ui/menu";

interface ChatWindowProps {
  selectedChat: any;
}

export default function ChatWindow({ selectedChat }: ChatWindowProps) {
  const { user, profile } = useAuth();
  const { messages, sendMessage, deleteMessage } = useChats();
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getOtherChatMember = () => {
    return selectedChat?.chat_members?.find(
      (member: any) => member.user_id !== profile?.id
    )?.users;
  };

  const otherMember = getOtherChatMember();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setIsLoading(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to send message",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toaster.create({
        title: "Message deleted",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to delete message",
        status: "error",
        duration: 3000,
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a chat
          </h3>
          <p className="text-gray-500">Choose a friend to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {otherMember?.name || "Unknown"}
            </h2>
            <p className="text-sm text-gray-500">{otherMember?.email}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                message.sender_id === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md ${
                  message.sender_id === user?.id ? "order-2" : "order-1"
                }`}
              >
                <div
                  className={`flex items-end space-x-2 ${
                    message.sender_id === user?.id
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender_id === user?.id
                        ? "bg-blue-500"
                        : "bg-gray-300"
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div
                    className={`relative group ${
                      message.sender_id === user?.id
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div
                      className={`text-xs text-gray-500 mt-1 ${
                        message.sender_id === user?.id
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {formatTime(message.sent_at)}
                    </div>

                    {/* Delete button for own messages */}
                    {message.sender_id === user?.id && (
                      <div
                        className={`absolute top-0 ${
                          message.sender_id === user?.id
                            ? "-left-8"
                            : "-right-8"
                        } opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        <MenuRoot>
                          <MenuTrigger asChild>
                            <Button size="xs" variant="ghost" colorScheme="red">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </MenuTrigger>
                          <MenuContent>
                            <MenuItem
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              Delete Message
                            </MenuItem>
                          </MenuContent>
                        </MenuRoot>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            disabled={!newMessage.trim()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
