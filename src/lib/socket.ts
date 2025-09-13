import { io } from "socket.io-client";
import { activeAuth } from "./axios";

export const socket = io("http://localhost:3333", {
  transports: ["websocket"],
  auth: {
    token: activeAuth,
  },
});
