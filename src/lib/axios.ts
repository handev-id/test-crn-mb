import axios from "axios";
import { Attachment, Message } from "./types";

export const auth = {
  agent1: `oat_MQ.TnpkbWpUNzNUVFUzVnNybTV4SVZyUVEzelkxZGFCM3pGblZFeGhmQTI5MjI0ODM3NzY`,
  admin: `oat_MjM.THVJNnZYWU9Rb1VKVlFiRWRlZzlrb25fRDJPS3NhTG9sV1NSRFRnMjI0MTc2MzYwNTc`,
};

export const activeAuth = auth.agent1;

export const client = axios.create({
  baseURL: "http://localhost:3333/api/v1.0",
  headers: {
    Authorization: "Bearer " + activeAuth,
  },
});

export interface Conversation {
  id: number;
  avatar: Attachment;
  lastMessage: Message;
  lastSeen: string;
  lastActivity: string;
  status: "assigned" | "unassigned";
  contact: {
    firstName: string;
    lastName: string;
    avatar: Attachment;
  };
  unreadCount: number;
  channelId: number;
  agentId: number;
  createdAt: string;
  updatedAt: string;
}

interface Response<T> {
  meta: {
    total: number;
  };
  data: T;
}

export const conversationApi = (): Promise<Response<Conversation[]>> => {
  return client.get("/conversation").then((res) => res.data);
};

export const conversationDetailApi = (id: number): Promise<Conversation> => {
  return client.get(`/conversation/${id}`).then((res) => res.data);
};

export const messageApi = ({
  conversationId,
}: {
  conversationId: number;
}): Promise<Response<Message[]>> => {
  return client.get(`/message/${conversationId}`).then((res) => res.data);
};
