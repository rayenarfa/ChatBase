import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useFriends } from "../hooks/useFriends";
import { supabase, User } from "../lib/supabase";
import { Search, UserPlus, X } from "lucide-react";
import { Button, Input } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({
  isOpen,
  onClose,
}: AddFriendModalProps) {
  const { user } = useAuth();
  const { sendFriendRequest, isBlocked } = useFriends();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(`id.eq.${searchQuery},email.ilike.%${searchQuery}%`)
        .neq("id", user?.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toaster.create({
        title: "Error",
        description: "Failed to search users",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setIsSendingRequest(true);
    try {
      // Check if user is blocked
      const blocked = await isBlocked(userId);
      if (blocked) {
        toaster.create({
          title: "Cannot send request",
          description: "This user has blocked you or you have blocked them",
          status: "error",
          duration: 3000,
        });
        return;
      }

      await sendFriendRequest(userId);
      toaster.create({
        title: "Friend request sent",
        status: "success",
        duration: 2000,
      });
      onClose();
    } catch (error) {
      toaster.create({
        title: "Error",
        description: "Failed to send friend request",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <DialogTitle>Add Friend</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by User ID or Email
              </label>
              <div className="flex space-x-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter user ID or email..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  isLoading={isSearching}
                  colorScheme="blue"
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  Search
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Search Results
                </h3>
                {searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {result.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {result.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">{result.email}</p>
                        <p className="text-xs text-gray-400">ID: {result.id}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      onClick={() => handleSendRequest(result.id)}
                      isLoading={isSendingRequest}
                    >
                      Add
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <p className="text-gray-500 text-center py-4">No users found</p>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
