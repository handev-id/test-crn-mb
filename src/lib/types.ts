export interface Attachment {
  name: string;
  extname: string;
  size: number;
  type: string;
  url: string;
}

export interface Sender {
  id: number;
  firstName: string;
  lastName: string;
  avatar: Attachment;
}

export interface Channel {
  id: number;
  name: string;
  logo: Attachment;
}

export interface Message {
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

export interface FormData {
  conversationId: number;
  channelId: number;
  senderId: number;
  text: string;
  attachment?: FileList;
  webhookMessageReplyId: string | null;
}
