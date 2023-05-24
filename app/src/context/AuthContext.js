import { createContext, useEffect, useReducer } from 'react';

const INITIAL_STATE = {
  isAuthenticated: false,
  user: {
    wallet: null,
  },
  signer: null,
};

function authReducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case 'LOGIN': {
      return {
        ...state,
        isAuthenticated: true,
        user: {
          wallet: payload.wallet.toLowerCase(),
        },
        signer: payload.signer,
      };
    }

    case 'LOGOUT': {
      return {
        ...state,
        isAuthenticated: false,
        user: {
          wallet: null,
        },
        signer: null,
      };
    }

    default: {
      return state;
    }
  }
}

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

  // When the chain id changes, reload the page to connect properly
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }, [window.ethereum]);

  // When the user account changes, disconnect the page and log the user out
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', () => {
      window.location.reload();
      dispatch({ type: 'LOGOUT' });
    });
  }, [window.ethereum]);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
