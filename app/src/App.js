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
import { ethers } from "ethers";

function App() {
  const [escrows, setEscrows] = useState([]);
  const [beneficiary, setBeneficiary] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [wethValue, setWethValue] = useState('1000000000000000000');
  const [userBalance, setUserBalance] = useState(null);
  const { isAuthenticated, user, signer } = useAuth();
  const [errors, setErrors] = useState({
    wethValue: null,
    arbiter: null,
    beneficiary: null,
  });

  // TODO: [x] Fetch existing user deployed contracts from the api
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
      // const _userBalance = await getUserBalance(user.wallet);
      // setUserBalance(_userBalance);
      setUserBalance(100);
    })();
  }, [isAuthenticated]);


  // Deploy the contract if the user has enough funds
  // and then register the smart contract using the API
  async function newContract() {
    if (!isAuthenticated) {
      alert("Please connect your wallet first");
      return;
    }
    
    if (!arbiter?.length) {
      setErrors((errors) => ({...errors, arbiter: "Invalid arbiter address" }));
      return;
    } else {
      setErrors((errors) => ({...errors, arbiter: null }));
    }

    if (!beneficiary?.length) {
      setErrors((errors) => ({...errors, beneficiary: "Invalid arbiter address" }));
      return;
    } else {
      setErrors((errors) => ({...errors, beneficiary: null }));
    }

    if (!wethValue?.length) {
      setErrors((errors) => ({...errors, wethValue: "Invalid arbiter address" }));
      return;
    } else {
      setErrors((errors) => ({...errors, wethValue: null }));
    }

    if (beneficiary === arbiter) {
      setErrors((errors) => ({...errors, beneficiary: "Beneficiary can't be the same as the arbiter" }));
      return;
    } else {
      setErrors((errors) => ({...errors, beneficiary: null }));
    }

    if (user.wallet === beneficiary) {
      setErrors((errors) => ({...errors, beneficiary: "Beneficiary can't be the same as the contract deployer" }));
      return;
    } else {
      setErrors((errors) => ({...errors, beneficiary: null }));
    }
    
    if (
      errors.arbiter?.length || 
      errors.beneficiary?.length || 
      errors.wethValue?.length
    ) {
      alert("Make sure to fix the errors before creating the contract");
      return;
    }

    const value = ethers.BigNumber.from(wethValue).toString();

    try {
      // Deploy the contract
      const escrowContract = await deploy(signer, arbiter, beneficiary, value)

      // Register the contract on the db using the api
      // TODO ---->
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
      // JSON-RPC error
      if (error.data?.message) {
        alert(error.data.message);
      } else {
        alert(error.message);
      }
    }
  }

  function handleSetArbiter(address) {
    setArbiter(address);
    if (!ethers.utils.isAddress(address)) {
      setErrors((errors) => ({...errors, arbiter: "Invalid arbiter address" }));
    } else {
      setErrors((errors) => ({...errors, arbiter: null }));
    }
  }

  function handleSetBeneficiary(address) {
    setBeneficiary(address);
    if (!ethers.utils.isAddress(address)) {
      setErrors((errors) => ({...errors, beneficiary: "Invalid arbiter address" }));
    } else {
      setErrors((errors) => ({...errors, beneficiary: null }));
    }
  }

  function handleSetWethValue(value) {
    setWethValue(value);
    if (value.matchAll(/^[\d]+$/)) {
      setErrors((errors) => ({...errors, wethValue: "Invalid WETH value provided" }));
    } else {
      setErrors((errors) => ({...errors, wethValue: null }));
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
            Welcome:
            <span className="semibold text-mono"> {user?.wallet} </span>
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
                onChange={(e) => handleSetArbiter(e.target.value)}
              />
              {
                errors.arbiter?.length ? (
                  <div className="mt-1">
                    <p className="text-[11px] text-red-500"> { errors.arbiter } </p>
                  </div>
                ) : null
              }
            </label>
            <hr />
            <label className="text-grotesk text-sm text-slate-700">
              Beneficiary Address
              <input
                className="text-mono text-md"
                value={beneficiary}
                onChange={(e) => handleSetBeneficiary(e.target.value)}
              />
              {
                errors.beneficiary?.length ? (
                  <div className="mt-1">
                    <p className="text-[11px] text-red-500"> { errors.beneficiary } </p>
                  </div>
                ) : null
              }
            </label>
            <hr />
            <label className="text-grotesk text-sm text-slate-700">
              Deposit Amount (in Wei)
              <input
                className="text-md"
                value={wethValue}
                onChange={(e) => handleSetWethValue(e.target.value)}
              />
              {
                errors.wethValue?.length ? (
                  <div className="mt-1">
                    <p className="text-[11px] text-red-500"> { errors.wethValue } </p>
                  </div>
                ) : null
              }
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
