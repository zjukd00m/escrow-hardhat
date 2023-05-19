import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import Navbar from './components/Navbar/Navbar';
import useAuth from './hooks/AuthHook';
import { approve, getTransacionsByUser, provider } from './utils';

function App() {
  const [escrows, setEscrows] = useState([]);
  const [beneficiary, setBeneficiary] = useState("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65");
  const [arbiter, setArbiter] = useState("0xbDA5747bFD65F08deb54cb465eB87D40e51B197E");
  const [wethValue, setWethValue] = useState("1000000000000000000");
  const { isAuthenticated, user, signer } = useAuth();

  // Listen transactions
  useEffect(() => {
    console.log("Will listen for transactions...")

    // Pending transactions
    provider.on("pending", (txHash) => {
      console.log("Pending tx: " + txHash);
    });

    // Confirmed transactions
    provider.on("transaction", (txHash) => {
      console.log("Confirmed tx: " + txHash);
    });
  }, []);

  // Fetch existing user deployed contracts
  useEffect(() => {
    if (!isAuthenticated) return;

    (async() => {
      let userTxs = await getTransacionsByUser(user.wallet);

      userTxs = userTxs?.map((tx) => {
        return {
          ...tx,
          handleApprove: async () => {
            const escrowContract = new ethers.Contract(tx.address, Escrow.abi, provider);

            escrowContract.on('Approved', () => {
              console.log( "✓ It's been approved!");
            });

            await approve(escrowContract, signer);
          },
            }
      })

      setEscrows(userTxs);
    })();
  }, [isAuthenticated]);

  async function newContract() {
    const value = ethers.BigNumber.from(wethValue).toString();

    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const txHash = escrowContract.deployTransaction.hash;
    const blockHash = escrowContract.deployTransaction.blockHash;
    const blockNumber = escrowContract.deployTransaction.blockNumber;

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value,
      txHash,
      blockHash,
      blockNumber,
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
           console.log( "✓ It's been approved!");
        });

        await approve(escrowContract, signer);
      },
      
    };

    setEscrows([...escrows, escrow]);
  }

  return (
    <div className="">
      <div className="">
        <Navbar />
      </div>
      {/* Welcome section */}
      {
        isAuthenticated ? (
          <div className="mt-6 mx-4">
            <p className="text-sm text-grotesk"> Welcome: <span className="semibold text-mono"> { user?.wallet } </span> </p>
          </div>
        ) : null
      }
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Create a new contract section */}
        <div className="bg-white shadow-lg my-6 mx-4 p-1">
          <h1 className="text-grotesk text-black"> New Contract </h1>
          <label className="text-grotesk text-sm text-slate-700">
            Arbiter Address
            <input className="text-mono text-md" value={arbiter} onChange={(e) => setArbiter(e.target.value)} />
          </label>

          <label className="text-grotesk text-sm text-slate-700">
            Beneficiary Address
            <input className="text-mono text-md" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
          </label>

          <label className="text-grotesk text-sm text-slate-700">
            Deposit Amount (in Wei)
            <input className="text-md" value={wethValue} onChange={(e) => setWethValue(e.target.value)} />
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
        {/* Contracts that were created */}
        <div className="mx-1">
          <h1 className="text-grotesk"> Existing Contracts </h1>
          <div>
            {escrows.map((escrow) => {
              return <Escrow key={escrow.address} {...escrow} />;
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
