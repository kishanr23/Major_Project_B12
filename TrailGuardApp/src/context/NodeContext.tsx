/**
 * NodeContext — holds the NodeInfo received from the connected BLE node,
 * so all screens can read the node's GPS coordinate without prop-drilling.
 */
import React, { createContext, useContext, useState } from 'react';
import type { trailguard } from '../proto/trailguard';

interface NodeContextValue {
  nodeInfo: trailguard.INodeInfo | null;
  setNodeInfo: (info: trailguard.INodeInfo) => void;
  isConnected: boolean;
  setIsConnected: (v: boolean) => void;
}

const NodeContext = createContext<NodeContextValue>({
  nodeInfo: null,
  setNodeInfo: () => {},
  isConnected: false,
  setIsConnected: () => {},
});

export function NodeProvider({ children }: { children: React.ReactNode }) {
  const [nodeInfo, setNodeInfo] = useState<trailguard.INodeInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <NodeContext.Provider value={{ nodeInfo, setNodeInfo, isConnected, setIsConnected }}>
      {children}
    </NodeContext.Provider>
  );
}

export function useNode() {
  return useContext(NodeContext);
}
