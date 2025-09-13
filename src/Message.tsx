import React, { useEffect, useRef, useState } from "react";
import { socket } from "./lib/socket";
import { Message } from "./lib/types";
import {
  Conversation,
  conversationApi,
  conversationDetailApi,
  messageApi,
} from "./lib/axios";
import { useApi } from "./lib/api";
import Form from "./Form";
import { useFieldArray, useForm } from "react-hook-form";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";

type FormValues = {
  activeConversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
};

const NewMessagePage: React.FC = () => {
  const userId = Number(window.location.href.split("/").pop());
  const bodyMsgs = useRef<HTMLDivElement>(null);
  const [webhookMessageReplyId, setWebhookMessageReplyId] = useState<
    string | null
  >(null);

  const { control, setValue, getValues, watch } = useForm<FormValues>({
    defaultValues: {
      activeConversation: null,
      conversations: [],
      messages: [],
    },
  });

  const {
    fields: conversationsFields,
    remove: removeConversation,
    insert: insertConversation,
    update: updateConversation,
  } = useFieldArray({
    control,
    name: "conversations",
    keyName: "_id",
  });

  const {
    fields: messagesFields,
    append: appendMessage,
    update: updateMessage,
  } = useFieldArray({
    control,
    name: "messages",
    keyName: "_id",
  });

  const conversations = useApi({
    api: conversationApi,
    onSuccess: (data) => {
      if (data) setValue("conversations", data.data);
    },
  });

  const conversation = useApi({
    api: conversationDetailApi,
  });

  const messages = useApi({
    api: messageApi,
    onSuccess: (data) => {
      if (data) setValue("messages", data.data);
      setTimeout(() => {
        if (bodyMsgs.current) {
          bodyMsgs.current.scroll({ top: bodyMsgs.current.scrollHeight });
        }
      }, 100);
    },
  });

  const joinConversation = (conv: Conversation) => {
    if (watch("activeConversation")?.id) {
      socket.emit("leave-conversation", watch("activeConversation")?.id);
    }
    const currentConvs = getValues("conversations");

    const convIdx = currentConvs.findIndex((c) => c.id === conv.id);
    updateConversation(convIdx, {
      ...conv,
      unreadCount: 0,
    });

    socket.emit("join-conversation", conv.id);
    setValue("activeConversation", conv);

    conversation.process(conv.id);
  };

  useEffect(() => {
    const handler = (data: {
      message: Message;
      conversation: Conversation;
    }) => {
      console.log(data);
      if (watch("activeConversation")?.id === data.conversation.id) {
        const currentMessages = getValues("messages");
        const msgIdx = currentMessages.findIndex(
          (m) => m.id === data.message.id
        );
        if (msgIdx >= 0) {
          updateMessage(msgIdx, data.message);
        } else {
          appendMessage(data.message);
        }
      }

      const isJoinConversation =
        watch("activeConversation")?.id === data.conversation.id;

      const currentConvs = getValues("conversations");
      const convIdx = currentConvs.findIndex(
        (c) => c.id === data.conversation.id
      );
      if (convIdx >= 0) {
        removeConversation(convIdx);
        insertConversation(0, {
          ...data.conversation,
          unreadCount: isJoinConversation ? 0 : data.conversation.unreadCount,
        });
      } else {
        insertConversation(0, data.conversation);
      }

      setTimeout(() => {
        if (bodyMsgs.current) {
          bodyMsgs.current.scroll({ top: bodyMsgs.current.scrollHeight });
        }
      }, 300);

      setWebhookMessageReplyId(null);
    };

    socket.on("new-message", handler);
    socket.on(
      "message-status",
      (data: { conversationId: number; messageId: number; status: string }) => {
        console.log(data);
        const currentMessages = getValues("messages");
        const currentMessage = currentMessages.find(
          (m) => m.id === data.messageId
        );
        const msgIdx = currentMessages.findIndex(
          (m) => m.id === data.messageId
        );
        updateMessage(msgIdx, {
          ...currentMessage!,
          status: data.status,
        });
      }
    );

    socket.on("user-status", (data) => {
      console.log(data);
    });

    socket.on("user-conversations-info", (data) => {
      console.log(data);
    });

    socket.on("campaign-list-update", (data) => {
      console.log(data);
    });

    socket.on("campaign-log-update", (data) => {
      console.log("CAMPAIGN LOG UPDATE", data);
    });

    socket.emit("join-campaign-log", 9);

    socket.on("conversation-status", (conv: Conversation) => {
      console.log(conv);
      const currentConvs = getValues("conversations");
      const convIdx = currentConvs.findIndex((c) => c.id === conv.id);

      if (conv.status === "unassigned") {
        insertConversation(0, conv);
        return;
      }

      if (conv.agentId === userId && conv.status === "assigned") {
        updateConversation(convIdx, conv);
      } else {
        removeConversation(convIdx);
      }
    });

    conversations.process({});
    return () => {
      socket.off("new-message", handler);
      if (watch("activeConversation")?.id) {
        socket.emit("leave-conversation", watch("activeConversation")?.id);
      }
    };
  }, []);

  useEffect(() => {
    if (watch("activeConversation")) {
      messages.process({
        conversationId: watch("activeConversation")?.id || 0,
      });
    }
  }, [watch("activeConversation")]);

  return (
    <div className="flex h-screen">
      <div className="w-[300px] bg-gray-100 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Conversations</h2>
        <ul className="space-y-2">
          {conversationsFields.map((conv: Conversation) => (
            <li
              key={conv.id}
              onClick={() => joinConversation(conv)}
              className={`flex items-center gap-3 p-3 rounded-lg shadow-sm cursor-pointer transition ${
                conv.id === watch("activeConversation")?.id
                  ? "bg-blue-200"
                  : "hover:bg-blue-100 bg-white"
              }`}
            >
              {/* Avatar */}
              <img
                src={conv.contact?.avatar?.url || "/default-avatar.png"}
                alt={`${conv.contact?.firstName} ${conv.contact?.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />

              {/* Info utama */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">
                    {`${conv.contact?.firstName ?? ""} ${
                      conv.contact?.lastName ?? ""
                    }`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {moment(conv.lastMessage.updatedAt).format("dddd HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="truncate">
                    {conv.lastMessage?.text || "No messages yet"}
                  </span>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}

                  <span
                    className={`${
                      conv.status === "assigned"
                        ? "bg-blue-500 text-white"
                        : "bg-yellow-200 text-black"
                    } ml-2 px-2 py-0.5 text-xs rounded-full`}
                  >
                    {conv.status}
                  </span>
                </div>
              </div>
            </li>
          ))}

          {/* Extra menu item */}
          <li>
            <a
              href="/"
              onClick={(e) => e.preventDefault()}
              className="block text-center py-2 text-blue-600 hover:underline"
            >
              HOME
            </a>
          </li>
        </ul>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b">
          <h1 className="text-2xl font-bold">
            {!watch("activeConversation")
              ? "No Active Conversation"
              : `${watch("activeConversation")?.contact?.firstName} ${
                  watch("activeConversation")?.contact?.lastName
                }`}
          </h1>
          <p>conversation {watch("activeConversation")?.id}</p>
        </div>
        <div ref={bodyMsgs} className="flex-1 p-6 overflow-y-auto bg-gray-200">
          {messagesFields.map((msg: Message) => {
            const isUser = msg.senderType === "user";
            const reply = msg.webhookMessageReply;

            return (
              <div
                key={msg.id}
                onClick={() => setWebhookMessageReplyId(msg.webhookMessageId)}
                className={`mb-4 flex ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* Avatar contact */}
                {!isUser && (
                  <img
                    src={msg.sender?.avatar?.url || "/default-avatar.png"}
                    alt={`${msg.sender?.firstName} ${msg.sender?.lastName}`}
                    className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                  />
                )}

                {/* Bubble */}
                <div className="max-w-xs md:max-w-md">
                  {/* Nama sender untuk contact */}
                  {!isUser && (
                    <div className="text-xs font-medium text-gray-700 mb-1 ml-1">
                      {`${msg.sender?.firstName ?? ""} ${
                        msg.sender?.lastName ?? ""
                      }`}
                    </div>
                  )}

                  <div
                    className={`relative px-3 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-line ${
                      isUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {/* Reply preview */}
                    {reply && (
                      <div
                        className={`mb-2 border-l-4 pl-2 text-xs p-1.5 rounded-md truncate ${
                          isUser
                            ? "border-blue-300 bg-blue-400/30 text-white"
                            : "border-gray-400 bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span className="font-medium">
                          {reply.sender?.firstName} {reply.sender?.lastName}
                        </span>
                        <div className="truncate">
                          {reply.text
                            ? reply.text
                            : reply.attachment
                            ? `[Attachment: ${reply.attachment.name}]`
                            : ""}
                        </div>
                      </div>
                    )}

                    {/* Main text */}
                    {msg.text && <span>{msg.text}</span>}

                    {/* Attachment */}
                    {msg.attachment && (
                      <div className="mt-2">
                        {msg.attachment.type?.startsWith("image/") ? (
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="max-w-[200px] rounded-md shadow"
                          />
                        ) : (
                          <a
                            href={msg.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`underline break-all ${
                              isUser ? "text-blue-200" : "text-blue-500"
                            }`}
                          >
                            {msg.attachment.name}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Time + status */}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                      <span>{moment(msg.createdAt).format("HH:mm")}</span>
                      {isUser && (
                        <>
                          {msg.status === "delivered" ? (
                            <Check size={14} />
                          ) : msg.status === "read" ? (
                            <CheckCheck size={14} />
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Form
          activeConversation={watch("activeConversation")}
          replyId={webhookMessageReplyId}
          bodyMsgs={bodyMsgs}
        />
      </div>
    </div>
  );
};

export default NewMessagePage;
