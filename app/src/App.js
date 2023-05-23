import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Escrow from './components/Escrow/Escrow';
import EscrowInterface from './artifacts/contracts/Escrow.sol/Escrow';
import useAuth from './hooks/AuthHook';
import { approve, deploy, getTransacionsByUser, provider } from './utils';

function App() {
  const [escrows, setEscrows] = useState([]);
  const [beneficiary, setBeneficiary] = useState(
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  );
  const [arbiter, setArbiter] = useState(
    '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E'
  );
  const [wethValue, setWethValue] = useState('1000000000000000000');
  const { isAuthenticated, user, signer } = useAuth();

  // Fetch existing user deployed contracts
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      let userTxs = await getTransacionsByUser(user.wallet);

      console.log('user txns');
      console.log(userTxs.length);

      userTxs = userTxs?.map((event) => {
        return {
          ...event,
          handleApprove: async () => {
            const escrowContract = new ethers.Contract(
              event.address,
              EscrowInterface.abi,
              provider
            );

            escrowContract.on('ApprovedEscrow', () => {
              console.log("✓ It's been approved!");
            });

            await approve(escrowContract, signer);
          },
        };
      });

      setEscrows(userTxs);
    })();
  }, [isAuthenticated]);

  async function newContract() {
    const value = ethers.BigNumber.from(wethValue).toString();

    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const txHash = escrowContract.deployTransaction.hash;
    const blockHash = escrowContract.deployTransaction.blockHash;
    const blockNumber = escrowContract.deployTransaction.blockNumber;

    // TODO: add the listener to change the 'Existing Contract' from not-mined to mined
    escrowContract.once('ContractDeployed', async () => {
      console.log('The contract has been deployed');
      console.log(escrowContract.deployTransaction.from);
      console.log(escrowContract.deployTransaction.to);
      console.log(escrowContract.deployTransaction.data);
      console.log({
        txHash,
        address: escrowContract.address,
        escrows,
      });

      // escrow._isMined = true;

      // const _escrows = escrows.filter((escrow) => escrow.txHash !== _txHash);

      // setEscrows([..._escrows, escrow]);
    });

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value,
      txHash,
      blockHash,
      blockNumber,
      handleApprove: async () => {
        escrowContract.on('ApprovedEscrow', () => {
          console.log("✓ It's been approved!");
        });

        await approve(escrowContract, signer);
      },
      _isApproved: false,
      _isMined: false,
    };

    setEscrows([...escrows, escrow]);
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
