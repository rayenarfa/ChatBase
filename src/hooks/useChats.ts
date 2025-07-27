import { useState, useEffect } from "react";
import { supabase, Chat, Message, User } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useFriends } from "./useFriends";

export function useChats() {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, friends]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      subscribeToMessages(selectedChat.id);
    }

    return () => {
      // Cleanup subscription
    };
  }, [selectedChat]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          *,
          chat_members!inner(
            user_id,
            users(*)
          )
        `
        )
        .eq("is_group", false)
        .eq("chat_members.user_id", user.id);

      if (error) throw error;

      // Filter chats to only show those with accepted friends
      const filteredChats =
        data?.filter((chat) => {
          const otherMember = chat.chat_members?.find(
            (member) => member.user_id !== user.id
          );
          return (
            otherMember &&
            friends.some((friend) => friend.id === otherMember.user_id)
          );
        }) || [];

      setChats(filteredChats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users(*)
        `
        )
        .eq("chat_id", chatId)
        .order("sent_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = (chatId: string) => {
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (content: string) => {
    if (!user || !selectedChat) return;

    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: selectedChat.id,
        sender_id: user.id,
        content,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  const createChat = async (friendId: string) => {
    if (!user) return;

    try {
      // Check if chat already exists
      const existingChat = chats.find((chat) => {
        const otherMember = chat.chat_members?.find(
          (member) => member.user_id !== user.id
        );
        return otherMember && otherMember.user_id === friendId;
      });

      if (existingChat) {
        setSelectedChat(existingChat);
        return existingChat;
      }

      // Create new chat
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          is_group: false,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add members to chat
      const { error: membersError } = await supabase
        .from("chat_members")
        .insert([
          { chat_id: chat.id, user_id: user.id },
          { chat_id: chat.id, user_id: friendId },
        ]);

      if (membersError) throw membersError;

      // Fetch updated chats
      await fetchChats();

      // Set as selected chat
      const newChat = { ...chat, chat_members: [] };
      setSelectedChat(newChat);

      return newChat;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  };

  const getChatWithUser = (userId: string) => {
    return chats.find((chat) => {
      const otherMember = chat.chat_members?.find(
        (member) => member.user_id !== user?.id
      );
      return otherMember && otherMember.user_id === userId;
    });
  };

  return {
    chats,
    selectedChat,
    messages,
    loading,
    setSelectedChat,
    sendMessage,
    deleteMessage,
    createChat,
    getChatWithUser,
    refresh: fetchChats,
  };
}
