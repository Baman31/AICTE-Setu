import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface MessagingPanelProps {
  applicationId: string;
  messages: Message[];
}

export default function MessagingPanel({ applicationId, messages: initialMessages }: MessagingPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await queryClient.invalidateQueries({ 
          queryKey: ["/api/applications", applicationId] 
        });
      } catch (error) {
        console.error("Error refreshing messages:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [applicationId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/applications/${applicationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/applications", applicationId] 
      });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  return (
    <div className="flex flex-col h-full" data-testid="messaging-panel">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-medium">Communication Thread</h3>
        <p className="text-sm text-muted-foreground">Application ID: {applicationId}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isCurrentUser ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.id}`}
            >
              {!message.isCurrentUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {message.sender.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[70%] ${message.isCurrentUser ? "order-first" : ""}`}>
                <div className={`rounded-lg p-4 ${
                  message.isCurrentUser 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card border"
                }`}>
                  {!message.isCurrentUser && (
                    <div className="mb-1">
                      <span className="text-sm font-medium">{message.sender}</span>
                      <span className="text-xs text-muted-foreground ml-2">({message.senderRole})</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {message.timestamp}
                </p>
              </div>

              {message.isCurrentUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {message.sender.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" data-testid="button-attach">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none min-h-0 h-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            data-testid="input-message"
          />
          <Button 
            onClick={handleSend} 
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
