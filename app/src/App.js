import { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Escrow from './components/Escrow/Escrow';
import EscrowInterface from './artifacts/contracts/Escrow.sol/Escrow';
import useAuth from './hooks/AuthHook';
import {
  approve,
  deploy,
  getContractData,
  getUserBalance,
} from './utils';
import { addContract, getUserContracts } from './api';
import { ethers } from "ethers";

function App() {
  const [escrows, setEscrows] = useState([]);
  const [beneficiary, setBeneficiary] = useState('0x15dBed50f0250B7D1459741de281057Dc277E7F7');
  const [arbiter, setArbiter] = useState('0x5Cd818d08A30091da451df3710965dF5659c1873');
  const [wethValue, setWethValue] = useState('1');
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

        if (!userContracts?.contracts?.length) return;

        const parsedContracts = await Promise.all(
          userContracts.contracts.map((contract) => getContractData(contract))
        );

        console.log("The user contracts");
        console.log(parsedContracts);


      } catch (error) {
        alert(error.message);
      }
    })();
  }, [isAuthenticated]);

  // Set the current user balance in ETH
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const _userBalance = await getUserBalance(user.wallet);

        console.log({ _userBalance })

        setUserBalance(_userBalance);
      } catch (error) {
        console.error(error.message);
      }
    })();
  }, [isAuthenticated]);

  // Deploy the contract if the user has enough funds
  // and then register the smart contract using the API
  async function newContract() {
    if (!isAuthenticated) {
      alert("Please connect your wallet first");
      return;
    }

    let deployErrors = {
      beneficiary: null,
      arbiter: null,
      wethValue: null,
    };
    
    if (!arbiter?.length || !ethers.utils.isAddress(arbiter)) {
      deployErrors.arbiter = "Invalid arbiter address";
    } else if (arbiter?.length && user.wallet.toLowerCase() === arbiter.toLowerCase()) {
      deployErrors.arbiter = "Arbiter can't be the same as the contract deployer";
    } else {
      deployErrors.arbiter = null;
    }

    if (!beneficiary?.length || !ethers.utils.isAddress(beneficiary)) {
      deployErrors.beneficiary = "Invalid beneficiary address";
    } else if (beneficiary?.length && arbiter?.length && beneficiary === arbiter) {
      deployErrors.beneficiary = "Beneficiary can't be the same as the arbiter";
    } else if (beneficiary?.length && user?.wallet === beneficiary) {
      deployErrors.beneficiary = "Beneficiary can't be the same as the contract deployer";
    } else if (beneficiary?.length && arbiter?.length && beneficiary === arbiter) {
      deployErrors.beneficiary = "Beneficiary can't be the same as the arbiter";
    } else {
      deployErrors.beneficiary = null;
    }

    if (!wethValue?.length || parseFloat(wethValue) <= 0 ) {
      deployErrors.wethValue = "Invalid amount of WETH to be sent";
    } else {
      deployErrors.wethValue = null;
    }

    setErrors(deployErrors);
    
    if (
      deployErrors.arbiter?.length ||
      deployErrors.beneficiary?.length ||
      deployErrors.wethValue?.length
    ) {
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
        value,
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
    if (!value.matchAll(/^[\d]+$/g)) return;
    else {
      setWethValue(value);
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
            Balance (in ETH): <span className="text-sm"> { userBalance } WETH </span>
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
              <span> Deposit Amount (in Wei) = { wethValue?.length ? parseFloat(ethers.utils.formatEther(wethValue)).toFixed(18) : null } ETH </span>
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
            {escrows?.length ? (
              <div className="overflow-y-auto h-[600px] bg-white shadow-lg">
                {
                  escrows.map((escrow) => {
                    return <Escrow key={escrow.address} {...escrow} />;
                  })
                }
              </div>
            ) : null }
        </div>
      </div>
    </div>
  );
}

export default App;
