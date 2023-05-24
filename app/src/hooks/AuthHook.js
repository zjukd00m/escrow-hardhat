import { useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import AuthContext from '../context/AuthContext';

const provider = new ethers.providers.Web3Provider(window.ethereum);

export default function useAuth() {
  const { state, dispatch } = useContext(AuthContext);

  useEffect(() => {
    if (!state.isAuthenticated) {
      (async () => {
        // List the connected accounts
        const accounts = await provider.listAccounts();

        // If an existing account is connected
        if (accounts?.length) {
          const signer = provider.getSigner();
          dispatch({ type: 'LOGIN', payload: { wallet: accounts[0], signer } });
        }
      })();
    }
  }, [state.isAuthenticated]);

  async function login() {
    const accounts = await provider.send('eth_requestAccounts', {});

    const signer = provider.getSigner();

    dispatch({ type: 'LOGIN', payload: { wallet: accounts[0], signer } });
  }

  async function logout() {
    alert('Disconnect your wallet from the extension');
  }

  return {
    login,
    logout,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    signer: state.signer,
  };
}
