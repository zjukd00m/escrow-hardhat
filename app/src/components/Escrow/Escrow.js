import { useEffect, useState } from 'react';
import { isContractApproved, isContractDeployed, provider } from '../../utils';
import { ethers } from 'ethers';
import useAuth from '../../hooks/AuthHook';
import EscrowArtifact from '../../artifacts/contracts/Escrow.sol/Escrow.json';

function copyToClipboard(address) {}

// TODO: Add a small loader animation when the contract creation transaction has not been mined
export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
  txHash,
  _isMined,
  _isApproved,
}) {
  const [expanded, setExpanded] = useState(false);
  const [isApproved, setIsApproved] = useState(_isApproved);
  const [isMined, setIsMined] = useState(_isMined);

  const { user } = useAuth();

  // Listen for the deployment of the smart contract and change its state (ContractDeployed solidity event)
  useEffect(() => {
    if (!provider) return;

    let escrowContract = null;

    (async () => {
      escrowContract = new ethers.Contract(
        address,
        EscrowArtifact.abi,
        provider
      );

      escrowContract.once('ContractDeployed', () => {
        console.log({ address });
        // console.log(escrowContract);
        setIsMined(true);
      });
    })();
  }, [provider]);

  // Verify if the contract has been approved
  useEffect(() => {
    if (!address) return;

    (async () => {
      const _approved = await isContractApproved(address);
      const isDeployed = await isContractDeployed(txHash, address);

      setIsApproved(_approved);
      setIsMined(isDeployed);
    })();
  }, [address]);

  return (
    <div className="flex flex-col items-start justify-between m-2 bg-[#2E3440] border border-slate-600">
      <div className="flex flex-col items-start justify-between w-full md:flex-row md:items-center">
        <div className="m-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-grotesk text-sm md:text-md grow">
              {' '}
              Contract address{' '}
            </p>
            <div className="text-mono text-xs rounded-lg p-1 bg-[#6272a4] text-white w-fit">
              {user?.wallet?.length && user.wallet === arbiter ? (
                <p className="">Arbiter</p>
              ) : user.wallet === beneficiary ? (
                <p className="">Beneficiary</p>
              ) : (
                <p className=""> Depositor </p>
              )}
            </div>
            {isMined ? (
              <div className="relative ml-5">
                <div className="group flex gap-2 bg-[#6272a4] p-1 rounded-lg">
                  <ion-icon
                    name="checkmark-outline"
                    style={{ color: '#50fa7b' }}
                  ></ion-icon>
                  <p className="text-xs text-mono"> Mined </p>
                </div>
              </div>
            ) : (
              <div className="relative ml-5">
                <div className="group flex gap-2 bg-[#6272a4] p-1 rounded-lg">
                  <ion-icon
                    name="alert-outline"
                    style={{ color: '#ff5555' }}
                  ></ion-icon>
                  <p className="text-xs text-mono"> Not mined </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-mono text-sm"> {address} </p>
            <ion-icon
              name="clipboard-outline"
              onClick={() => copyToClipboard(address)}
            ></ion-icon>
          </div>
        </div>
        <div className="flex flex-row-reverse md:flex-col md:items-end items-center">
          <div
            className="md:mr-3 ml-[10em]"
            onClick={() => setExpanded(!expanded)}
          >
            <ion-icon name="chevron-down-outline"></ion-icon>
          </div>
          {isApproved ? (
            <div className="px-3 m-3 py-1 w-fit text-xs md:text-sm bg-green-100 text-black text-grotesk">
              <p className="text-xs"> Approved! </p>
            </div>
          ) : (
            <div
              className={`px-3 py-1 bg-[#EBCB8B] text-black text-grotesk text-xs md:text-sm w-fit m-3 cursor-pointer ${
                user?.wallet?.length && user.wallet !== arbiter
                  ? 'cursor-not-allowed'
                  : null
              }`}
              id={address}
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
            >
              Approve
            </div>
          )}
        </div>
      </div>
      {expanded ? (
        <div className="border-b-2 border-slate-600 h-1 w-full px-4"></div>
      ) : null}
      <div className="bg-[#2E3440] w-full">
        {expanded ? (
          <ul className="">
            <li className="p-3">
              <div className="text-grotesk text-white uppercase text-sm mb-1">
                Arbiter
              </div>
              <div className="text-white text-mono text-xs md:text-sm">
                {arbiter}
              </div>
            </li>
            <li className="p-3">
              <div className="text-grotesk text-white uppercase text-sm mb-1">
                Beneficiary
              </div>
              <div className="text-white text-mono md:text-sm text-xs">
                {beneficiary}
              </div>
            </li>
            <li className="p-3">
              <div className="text-grotesk text-white uppercase text-sm mb-1">
                Value (IN WEI)
              </div>
              <div className="text-white text-mono md:text-sm text-xs">
                {value}
                <span className="">
                  {value ? ` (${ethers.utils.formatEther(value)} ETH)` : null}
                </span>
              </div>
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
