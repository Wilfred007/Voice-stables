import { AppConfig, UserSession, authenticate as showStacksAuth } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export const network = STACKS_TESTNET;

export const appDetails = {
  name: 'Voice Stables',
  icon: typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '',
};

export function authenticate() {
  try {
    showStacksAuth({
      appDetails,
      userSession,
      onFinish: () => window.location.reload(),
    });
  } catch (e) {
    console.error('Authentication error:', e);
    alert('Failed to start authentication. Please check your wallet.');
  }
}

export function disconnect() {
  userSession.signUserOut();
  if (typeof window !== 'undefined') window.location.reload();
}

export function getUserAddress(): string | null {
  if (userSession.isUserSignedIn()) {
    try {
      const userData = userSession.loadUserData();
      return (
        // Prefer testnet when available
        (userData as any).profile?.stxAddress?.testnet ||
        (userData as any).profile?.stxAddress?.mainnet ||
        (userData as any).profile?.stxAddress ||
        null
      );
    } catch (e) {
      console.error('Error loading user data:', e);
      return null;
    }
  }
  return null;
}
