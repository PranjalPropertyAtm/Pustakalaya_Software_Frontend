import { useSocket } from "@/hooks/useSocket";

/** Lazy-loaded wrapper so socket.io-client stays out of the initial bundle. */
export default function SocketProvider() {
  useSocket();
  return null;
}
