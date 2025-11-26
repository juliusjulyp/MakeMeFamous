import { getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  okxWallet,
  trustWallet,
  phantomWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';

// Custom Polygon Amoy with faster RPC
const customPolygonAmoy = {
  ...polygonAmoy,
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology', 'https://polygon-amoy.drpc.org'],
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology', 'https://polygon-amoy.drpc.org'],
    },
  },
};

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your_project_id';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        okxWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        rainbowWallet,
        trustWallet,
        phantomWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'MakeMeFamous',
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [polygon, customPolygonAmoy],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http('https://polygon-amoy-bor-rpc.publicnode.com', {
      batch: false, // Disable batching for better compatibility
      retryCount: 5,
      timeout: 30000,
    }),
  },
  ssr: true,
});