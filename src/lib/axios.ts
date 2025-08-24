import axios from "axios";
import { Attachment, Message } from "./types";

const auth = {
  agent1: `Bearer oat_MQ.LWthS1o4NF9qOHlQMHA3S2VSdVdzX0gwcUd1d1FnX0t2WGQ3NmlsTDU1NjQ2Nzk5NA`,
  agent2: `Bearer oat_Mg.SjRRNjI3MXRRYlNaTGh6dEsyTHJkaW1nRXpMM25JRWJyY3Q0TWVGODIxMjExNzc0Nzc`,
};

export const client = axios.create({
  baseURL: "http://localhost:3333/api/v1.0",
  headers: {
    Authorization: auth.agent2,
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
