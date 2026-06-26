import { create } from 'zustand';

interface Device {
  region: string;
  id: string;
  name: string;
  ip: string;
  type: string;
  cpu: number;
  memory: number;
  status: "up" | "down";
  trafficIn: number;
  trafficOut: number;
  timestamp: string;
}

interface DeviceStore {
  devices: Device[];
  setDevices: (devices: Device[]) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  setDevices: (devices) => set({ devices }),
}));