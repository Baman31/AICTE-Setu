import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";

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

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: "Current User",
      senderRole: "Institution",
      content: newMessage,
      timestamp: new Date().toLocaleString(),
      isCurrentUser: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
    console.log('Message sent:', message);
  };

  return (
    <div className="flex flex-col h-full" data-testid="messaging-panel">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-medium">Communication Thread</h3>
        <p className="text-sm text-muted-foreground">Application ID: {applicationId}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
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
        ))}
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
          <Button onClick={handleSend} data-testid="button-send">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
