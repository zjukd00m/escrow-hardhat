import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Escrow from './components/Escrow/Escrow';
import EscrowInterface from './artifacts/contracts/Escrow.sol/Escrow';
import useAuth from './hooks/AuthHook';
import {
  approve,
  deploy,
  getTransacionsByUser,
  getUserBalance,
  provider,
} from './utils';
import { addContract, getUserContracts } from './api';

function App() {
  const [escrows, setEscrows] = useState([]);
  const [beneficiary, setBeneficiary] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [wethValue, setWethValue] = useState('1000000000000000000');
  const [userBalance, setUserBalance] = useState(null);
  const { isAuthenticated, user, signer } = useAuth();

  // Fetch existing user deployed contracts
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      let userTxs = await getTransacionsByUser(user.wallet);

      userTxs = userTxs?.map((event) => {
        return {
          ...event,
          handleApprove: async () => {
            const escrowContract = new ethers.Contract(
              event.address,
              EscrowInterface.abi,
              provider
            );

            await approve(escrowContract, signer);
          },
        };
      });

      setEscrows(userTxs);
    })();
  }, [isAuthenticated]);

  // TODO: Fetch existing user deployed contracts from the api
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const userContracts = await getUserContracts(user.wallet);

        if (!userContracts?.length) return;

      } catch (error) {
        alert(error.message);
      }
    })();
  }, [isAuthenticated]);

  // Set the current user balance in ETH
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      const _userBalance = await getUserBalance(user.wallet);
      setUserBalance(_userBalance);
    })();
  }, [isAuthenticated]);

  async function newContract() {
    if (!isAuthenticated) {
      alert("Please connect your wallet first");
      return;
    }

    if (!parseInt(wethValue)) {
      alert('Must provide a valid value (in WETH)');
      return;
    }

    if (!ethers.utils.isAddress(arbiter)) {
      alert('Must provide a valid ethereum address for the arbiter');
      return;
    }

    if (!ethers.utils.isAddress(beneficiary)) {
      alert('Must provide a valid ethereum address for the benefiary');
      return;
    }

    const value = ethers.BigNumber.from(wethValue).toString();

    try {
      // Deploy the contract
      const escrowContract = await deploy(signer, arbiter, beneficiary, value);

      // Register the contract on the db using the api
      await addContract({
        contractAddress: escrowContract.address,
        arbiter,
        beneficiary,
        deployer: user.wallet,
      });

      const escrow = {
        address: escrowContract.address,
        arbiter,
        beneficiary,
        value,
        txHash: escrowContract.deployTransaction.hash,
        handleApprove: async () => {
          await approve(escrowContract, signer);
        },
      };

      setEscrows([...escrows, escrow]);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="">
      <div className="">
        <Navbar />
      </div>
      {/* Welcome section */}
      {isAuthenticated ? (
        <div className="mt-6 mx-4">
          <p className="text-sm text-grotesk">
            {' '}
            Welcome:{' '}
            <span className="semibold text-mono"> {user?.wallet} </span>{' '}
          </p>
          <p className="text-mono text-sm">
            Balance (in ETH): <span className="text-sm"> {userBalance} </span>
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Create a new contract section */}
        <div className="">
          <div className="bg-white shadow-lg my-6 mx-4 p-1 border-box">
            <h1 className="text-grotesk text-black"> New Contract </h1>
            <label className="text-grotesk text-sm text-slate-700">
              Arbiter Address
              <input
                className="text-mono text-md"
                value={arbiter}
                onChange={(e) => setArbiter(e.target.value)}
              />
            </label>

            <label className="text-grotesk text-sm text-slate-700">
              Beneficiary Address
              <input
                className="text-mono text-md"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
              />
            </label>

            <label className="text-grotesk text-sm text-slate-700">
              Deposit Amount (in Wei)
              <input
                className="text-md"
                value={wethValue}
                onChange={(e) => setWethValue(e.target.value)}
              />
            </label>

            <div
              className="text-grotesk w-fit bg-[#EBCB8B] text-center px-2 py-[0.3em] mx-4 text-black hover:cursor-pointer text-sm md:text-md"
              onClick={(e) => {
                e.preventDefault();
                newContract();
              }}
            >
              Deploy
            </div>
          </div>
        </div>
        {/* Contracts that were created */}
        <div className="mx-1">
          <h1 className="text-grotesk"> Existing Contracts </h1>
          <div className="overflow-y-auto h-[600px] bg-white shadow-lg">
            {escrows?.length ? (
              escrows.map((escrow) => {
                return <Escrow key={escrow.address} {...escrow} />;
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="bg-slate-200 p-4 flex items-center">
                  <div>
                    <p className="text-lg text-grotesk text-black">
                      No available contracts
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
