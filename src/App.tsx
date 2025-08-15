import React, { useState, useEffect, useRef } from "react";
import { socket } from "./lib/socket";

const WaEventsPage: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string>("6283836319218");
  const prevDeviceId = useRef<string>(deviceId);

  useEffect(() => {
    socket.on("connection-status", (data) => {
      console.log("Connection Status:", data);
    });

    socket.emit("join-wa", deviceId);

    return () => {
      socket.emit("leave-wa", prevDeviceId.current);
      prevDeviceId.current = deviceId;
      socket.off("connection-status");
    };
  }, [deviceId]);

  return (
    <div style={{ padding: 20 }}>
      <h1>WA Events Page</h1>
      <p>
        Current Device: <strong>{deviceId}</strong>
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => setDeviceId("6283836319218")}>Device 1</button>
        <button onClick={() => setDeviceId("62838123")}>Device 2</button>
      </div>
    </div>
  );
};

export default WaEventsPage;
