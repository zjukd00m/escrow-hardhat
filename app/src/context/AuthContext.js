import { createContext, useReducer } from "react";

const INITIAL_STATE = {
    isAuthenticated: false,
    user: {
        wallet: null,
    },
    signer: null,
}

function authReducer (state, action) {
    const { type, payload } = action;

    switch (type) {
        case "LOGIN": {
            return {
                ...state,
                isAuthenticated: true,
                user: {
                    wallet: payload.wallet,
                },
                signer: payload.signer,
            }
        }

        case "LOGOUT": {
            return {
                ...state,
                isAuthenticated: false,
                user: {
                    wallet: null
                },
                signer: null,
            }
        }

        default: {
            return state;
        }
    }
}


const AuthContext = createContext();

export function AuthContextProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);
    return (
        <AuthContext.Provider value={{ state, dispatch }}>
            { children }
        </AuthContext.Provider>
    )
}

export default AuthContext;