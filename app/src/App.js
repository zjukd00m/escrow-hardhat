import { ethers } from 'ethers';
import { useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import Navbar from './components/Navbar/Navbar';
import useAuth from './hooks/AuthHook';

//  cruel slice topic ladder shaft inch top such runway start gold tragic 

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const { isAuthenticated, user, signer } = useAuth();

  async function newContract() {
    console.log("Will deploy the contract !!!")
    console.log(signer)
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.BigNumber.from(document.getElementById('wei').value);

    console.log({
      beneficiary,
      arbiter,
      value
    })

    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    console.log("The escro sm")

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
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
          <label className="text-grotesk text-sm">
            Arbiter Address
            <input type="text" id="arbiter" className="text-mono text-xs" />
          </label>

          <label className="text-grotesk text-sm">
            Beneficiary Address
            <input type="text" id="beneficiary" className="text-mono text-xs" />
          </label>

          <label className="text-grotesk text-sm">
            Deposit Amount (in Wei)
            <input id="wei" type="text" className="text-xs" />
          </label>

          <div
            className="text-grotesk w-fit bg-[#EBCB8B] text-center px-2 py-[0.3em] mx-4 text-black hover:cursor-pointer"
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
