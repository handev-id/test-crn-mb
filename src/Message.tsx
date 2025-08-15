import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { socket } from "./lib/socket";

interface Attachment {
  name: string;
  extname: string;
  size: number;
  type: string;
  url: string;
}

interface Sender {
  id: number;
  firstName: string;
  lastName: string;
  avatar: Attachment;
}

interface Channel {
  id: number;
  name: string;
  logo: Attachment;
}

interface Message {
  id: number;
  text: string;
  attachment?: Attachment;
  status: string;
  senderId: number;
  sender: Sender;
  channel: Channel;
  senderType: "user" | "contact";
  conversationId: number;
  webhookMessageId: string;
  webhookMessageReplyId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  conversationId: number;
  channelId: number;
  senderId: number;
  text: string;
  attachment?: FileList;
  webhookMessageReplyId: string | null;
}

const NewMessagePage: React.FC = () => {
  const { register, handleSubmit } = useForm<FormData>();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    socket.on("new-message", (data: { message: Message }) => {
      console.log(data);
      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      socket.off("new-message");
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    console.log(data);
    socket.emit(
      "send-message",
      {
        conversationId: Number(data.conversationId),
        channelId: Number(data.channelId),
        senderId: Number(data.senderId),
        text: data.text,
        attachment: (await data.attachment?.[0]?.arrayBuffer()) || null,
        webhookMessageReplyId: null,
      },
      (result: any) => {
        console.log(result);
      }
    );
    // reset();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>New Message</h1>
      {messages?.[0] && (
        <div>
          <p>Conversation ID: {messages[0].conversationId}</p>
        </div>
      )}

      <div style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: "10px",
              textAlign: msg.senderType === "user" ? "right" : "left",
            }}
          >
            <div>
              <strong>
                {`${msg.sender?.firstName} ${msg.sender?.lastName}`}
              </strong>
            </div>
            <div>{msg.text}</div>
            {msg.attachment && (
              <div>
                <img
                  src={msg.attachment.url}
                  alt={msg.attachment.name}
                  style={{ maxWidth: "150px", marginTop: "5px" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <form style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
        <input
          {...register("conversationId", { required: true })}
          placeholder="Conversation ID"
        />
        <input
          {...register("channelId", { required: true })}
          placeholder="Channel ID"
        />
        <input
          type="number"
          {...register("senderId", { required: true })}
          placeholder="Sender ID"
        />
        <input
          {...register("text", { required: true })}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "8px" }}
        />
        <input type="file" {...register("attachment")} />
        <button
          onClick={() => {
            handleSubmit(onSubmit)();
          }}
          type="button"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default NewMessagePage;
