import { useState, useEffect } from "react";
import { supabase, FriendRequest, User } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function useFriends() {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
      fetchFriends();
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          sender:users!friend_requests_sender_id_fkey(*),
          receiver:users!friend_requests_receiver_id_fkey(*)
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get accepted friend requests
      const { data: acceptedRequests, error: requestsError } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          sender:users!friend_requests_sender_id_fkey(*),
          receiver:users!friend_requests_receiver_id_fkey(*)
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (requestsError) throw requestsError;

      // Extract friend users from accepted requests
      const friendUsers: User[] = [];
      acceptedRequests?.forEach((request) => {
        if (request.sender_id === user.id && request.receiver) {
          friendUsers.push(request.receiver);
        } else if (request.receiver_id === user.id && request.sender) {
          friendUsers.push(request.sender);
        }
      });

      setFriends(friendUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending",
      });

      if (error) throw error;
      await fetchFriendRequests();
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  };

  const respondToFriendRequest = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;
      await fetchFriendRequests();
      await fetchFriends();
    } catch (error) {
      console.error("Error responding to friend request:", error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      // Delete friend request
      const { error: requestError } = await supabase
        .from("friend_requests")
        .delete()
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
        );

      if (requestError) throw requestError;

      // Delete chat and messages
      const { data: chats, error: chatsError } = await supabase
        .from("chats")
        .select(
          `
          id,
          chat_members!inner(user_id)
        `
        )
        .eq("is_group", false)
        .eq("chat_members.user_id", user.id);

      if (chatsError) throw chatsError;

      // Find the private chat between these two users
      const privateChat = chats?.find((chat) =>
        chat.chat_members?.some((member) => member.user_id === friendId)
      );

      if (privateChat) {
        // Delete messages first
        const { error: messagesError } = await supabase
          .from("messages")
          .delete()
          .eq("chat_id", privateChat.id);

        if (messagesError) throw messagesError;

        // Delete chat members
        const { error: membersError } = await supabase
          .from("chat_members")
          .delete()
          .eq("chat_id", privateChat.id);

        if (membersError) throw membersError;

        // Delete chat
        const { error: chatError } = await supabase
          .from("chats")
          .delete()
          .eq("id", privateChat.id);

        if (chatError) throw chatError;
      }

      await fetchFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  };

  const blockUser = async (userId: string) => {
    if (!user) return;

    try {
      // Update friend request status to blocked
      const { error: requestError } = await supabase
        .from("friend_requests")
        .update({ status: "blocked" })
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
        );

      if (requestError) throw requestError;

      // Add to blocked users table
      const { error: blockError } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

      if (blockError) throw blockError;

      await fetchFriendRequests();
      await fetchFriends();
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  };

  const isBlocked = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("*")
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`
        )
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking blocked status:", error);
      return false;
    }
  };

  return {
    friendRequests,
    friends,
    loading,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    blockUser,
    isBlocked,
    refresh: () => {
      fetchFriendRequests();
      fetchFriends();
    },
  };
}
