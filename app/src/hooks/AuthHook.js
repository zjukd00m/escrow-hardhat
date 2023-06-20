import { useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import AuthContext from '../context/AuthContext';
import { createUser, userExist } from '../api';

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
    await provider.send('eth_requestAccounts', {});

    const signer = provider.getSigner();

    const userWallet = await signer.getAddress();

    await createUser(userWallet)
      .then((r) => {
        console.log("The user was created");
        console.log(r);
      })
      .catch((error) => {
        console.error(error.message)
      });

    dispatch({ type: 'LOGIN', payload: { wallet: userWallet, signer } });
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
