import { useState } from 'react';
import useAuth from '../../hooks/AuthHook';
import { createUser } from '../../api';

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(true);
  const { isAuthenticated, login, logout } = useAuth();

  // TODO: Handle the api call
  async function handleConnectWallet() {
    try {
      // Login first
      const userWallet = await login();
      // Then try to create a new account at the db
      await createUser(userWallet)
        .catch((res) => console.log(res));
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="w-screen shadow-lg">
      <nav className="flex flex-col lg:flex-row lg:items-center bg-[#2E3440] p-[0.5em]">
        <div className="flex items-center lg:flex-grow">
          <p className="text-2xl semibold grow ml-4 text-grotesk">
            Polygon Escrow
          </p>
          <div
            className="right-0 mr-4 lg:hidden"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ion-icon name="grid-sharp"></ion-icon>
          </div>
        </div>
        {collapsed ? (
          <ul className="flex flex-col gap-2 mt-4 mx-4 mb-4 lg:flex-row lg:items-center lg:gap-6">
            <li className="">
              {!isAuthenticated ? (
                <button
                  className="text-sm text-grotesk bg-black text-white px-4 py-2"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </button>
              ) : (
                <button
                  className="text-sm text-grotesk bg-black text-white px-4 py-2"
                  onClick={logout}
                >
                  Disconnect
                </button>
              )}
            </li>
          </ul>
        ) : null}
      </nav>
    </div>
  );
}
