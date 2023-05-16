import { useContext, useEffect } from "react";
import { ethers } from "ethers";
import AuthContext from "../context/AuthContext";

const provider = new ethers.providers.Web3Provider(window.ethereum);

export default function useAuth() {
    const { state, dispatch } = useContext(AuthContext);

    useEffect(() => {
        if (!state.isAuthenticated) { 
            (async () => {
                const accounts = await provider.send("eth_requestAccounts", {})
                // If an existing account is connected
                if (accounts?.length) {
                    const signer = provider.getSigner();
                    console.log("tHE SIGNER")
                    console.log(signer)
                    dispatch({ type: "LOGIN", payload: { wallet: accounts[0], signer }});
                }
            })();
        }
    }, [state.isAuthenticated]);

    async function login() {
        const accounts = await provider.send("eth_requestAccounts", {})

        const signer = provider.getSigner();

        dispatch({ type: "LOGIN", payload: { wallet: accounts[0], signer }});
    }
    
    async function logout() {
        console.log("Will logout")
    }

    return {
        login,
        logout,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
    } 
}