// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// import { io } from "socket.io-client";
// import { useAuth } from "./AuthContext";

// const SocketContext = createContext(null);

// const SOCKET_URL =
//   import.meta.env.VITE_SOCKET_URL ||
//   "http://localhost:3000";

// export function SocketProvider({ children }) {
//   const { user } = useAuth();

//   const [socket, setSocket] = useState(null);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     if (!user?.id) {
//       setSocket(null);
//       setConnected(false);
//       return;
//     }

//     const token = localStorage.getItem("token");

//     if (!token) {
//       console.error("JWT token not found");
//       return;
//     }

//     const socketInstance = io(SOCKET_URL, {
//       auth: {
//         token,
//       },
//       autoConnect: true,
//       reconnection: true,
//       reconnectionAttempts: Infinity,
//       reconnectionDelay: 1000,
//     });

//     socketInstance.on("connect", () => {
//       setConnected(true);
//       console.log("Socket connected:", socketInstance.id);
//     });

//     socketInstance.on("disconnect", (reason) => {
//       setConnected(false);
//       console.log("Socket disconnected:", reason);
//     });

//     socketInstance.on("connect_error", (error) => {
//       setConnected(false);
//       console.error("Socket connection error:", error.message);
//     });

//     setSocket(socketInstance);

//     return () => {
//       socketInstance.disconnect();
//       setSocket(null);
//       setConnected(false);
//     };
//   }, [user?.id]);

//   return (
//     <SocketContext.Provider value={{ socket, connected }}>
//       {children}
//     </SocketContext.Provider>
//   );
// }

// export function useSocket() {
//   const context = useContext(SocketContext);

//   if (!context) {
//     throw new Error(
//       "useSocket must be used inside SocketProvider"
//     );
//   }

//   return context;
// }




// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// import { io } from "socket.io-client";
// import { useAuth } from "./AuthContext";

// const SocketContext = createContext(null);

// const SOCKET_URL =
//   import.meta.env.VITE_SOCKET_URL ||
//   "http://localhost:3000";

// export function SocketProvider({ children }) {
//   const { user, loading } = useAuth();

//   const [socket, setSocket] = useState(null);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     if (loading || !user?.id) {
//       return;
//     }

//     const socketInstance = io(SOCKET_URL, {
//       withCredentials: true,
//       autoConnect: true,
//       reconnection: true,
//       reconnectionAttempts: Infinity,
//       reconnectionDelay: 1000,
//     });

//     socketInstance.on("connect", () => {
//       setConnected(true);
//       console.log("Socket connected:", socketInstance.id);
//     });

//     socketInstance.on("disconnect", (reason) => {
//       setConnected(false);
//       console.log("Socket disconnected:", reason);
//     });

//     socketInstance.on("connect_error", (error) => {
//       setConnected(false);
//       console.error("Socket connection error:", error.message);
//     });

//     setSocket(socketInstance);

//     return () => {
//       socketInstance.disconnect();
//       setSocket(null);
//       setConnected(false);
//     };
//   }, [user?.id, loading]);

//   return (
//     <SocketContext.Provider value={{ socket, connected }}>
//       {children}
//     </SocketContext.Provider>
//   );
// }

// export function useSocket() {
//   const context = useContext(SocketContext);

//   if (!context) {
//     throw new Error("useSocket must be used inside SocketProvider");
//   }

//   return context;
// }


import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

export function SocketProvider({ children }) {
  const { user, loading } = useAuth();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Wait until authentication check completes
    if (loading || !user?.id) {
      setSocket(null);
      setConnected(false);
      return;
    }

    // Cookie is automatically sent by the browser
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,

      autoConnect: true,

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on("connect", () => {
      setConnected(true);

      console.log(
        "Socket connected:",
        socketInstance.id
      );
    });

    socketInstance.on("disconnect", (reason) => {
      setConnected(false);

      console.log(
        "Socket disconnected:",
        reason
      );
    });

    socketInstance.on("connect_error", (error) => {
      setConnected(false);

      console.error(
        "Socket connection error:",
        error.message
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();

      setSocket(null);
      setConnected(false);
    };
  }, [user?.id, loading]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocket must be used inside SocketProvider"
    );
  }

  return context;
}

