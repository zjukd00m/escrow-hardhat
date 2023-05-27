import { useEffect, useState } from 'react';
import { isContractApproved, provider } from '../../utils';
import { ethers } from 'ethers';
import useAuth from '../../hooks/AuthHook';
import EscrowArtifact from '../../artifacts/contracts/Escrow.sol/Escrow.json';

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
  txHash,
  _isApproved,
}) {
  const [expanded, setExpanded] = useState(false);
  const [isApproved, setIsApproved] = useState(_isApproved);
  const [copiedToClipboad, setCopiedToClipboard] = useState(false);

  const { user } = useAuth();

  async function copyToClipboard(address) {
    await window.navigator.clipboard.writeText(address);

    setCopiedToClipboard(true);

    setTimeout(() => {
      setCopiedToClipboard(false);
    }, 3000);
  }

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

      escrowContract.once('ApprovedEscrow', () => {
        setIsApproved(true);
      });
    })();

    // On unmounted component, remove the contract listeners
    return () => {
      if (escrowContract) {
        escrowContract.removeAllListeners('ContractDeployed');
        escrowContract.removeAllListeners('ApprovedEscrow');
      }
    };
  }, [provider]);

  // Verify if the contract has been approved
  useEffect(() => {
    if (!address) return;

    (async () => {
      const _approved = await isContractApproved(address);

      setIsApproved(_approved);
    })();
  }, [address]);

  return (
    <div className="flex flex-col items-start justify-between m-2 bg-[#2E3440] border border-slate-600">
      <div className="flex flex-col items-start justify-between w-full md:flex-row md:items-center">
        <div className="m-3">
          <div className="flex flex-col gap-3 items-center justify-between mb-3 md:flex">
            <p className="text-grotesk text-sm md:text-md grow w-full">
              Contract address
            </p>
            <div className="flex items-center w-full">
              <div className="text-mono text-xs rounded-lg p-1 bg-[#6272a4] text-white w-fit">
                {user?.wallet?.length && user.wallet === arbiter ? (
                  <p className="">Arbiter</p>
                ) : user?.wallet?.length && user.wallet === beneficiary ? (
                  <p className="">Beneficiary</p>
                ) : user?.wallet?.length ? (
                  <p className=""> Depositor </p>
                ) : (
                  <p className=""> Loading... </p>
                )}
              </div>
              {isApproved ? (
                <div className="relative ml-5">
                  <div className="group flex gap-2 bg-[#6272a4] p-1 rounded-lg">
                    <ion-icon
                      name="checkmark-outline"
                      style={{ color: '#50fa7b' }}
                    ></ion-icon>
                    <p className="text-xs text-mono"> Approved </p>
                  </div>
                </div>
              ) : (
                <div className="relative ml-5">
                  <div className="group flex gap-2 bg-[#6272a4] p-1 rounded-lg">
                    <ion-icon
                      name="alert-outline"
                      style={{ color: '#ff5555' }}
                    ></ion-icon>
                    <p className="text-xs text-mono"> Waiting </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-mono text-xs md:text-sm truncate"> {address} </p>
            {!copiedToClipboad ? (
              <ion-icon
                name="clipboard-outline"
                onClick={() => copyToClipboard(address)}
              ></ion-icon>
            ) : (
              <ion-icon name="checkbox-outline"></ion-icon>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pr-3 md:flex-col-reverse md:items-end w-full">
          {isApproved ? (
            <div></div>
          ) : (
            <div
              className={`px-3 py-1 bg-[#EBCB8B] text-black text-grotesk text-xs md:text-sm m-3 cursor-pointer ${
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
          <div
            className="md:pr-3 md:pt-3"
            onClick={() => setExpanded(!expanded)}
          >
            <ion-icon name="chevron-down-outline"></ion-icon>
          </div>
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
              <div className="text-white text-mono text-xs md:text-sm w-full truncate">
                {arbiter}
              </div>
            </li>
            <li className="p-3">
              <div className="text-grotesk text-white uppercase text-sm mb-1">
                Beneficiary
              </div>
              <div className="text-white text-mono md:text-sm text-xs truncate">
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
            <li className="p-3">
              <div className="text-grotesk text-white uppercase text-sm mb-1">
                TX Hash
              </div>
              <div className="w-2/3">
                <div
                  className="text-white text-mono md:text-sm text-xs truncate hover:text-[#50fa7b] hover:opacity-80 cursor-pointer"
                  onClick={() => {
                    console.log(
                      `I will take you to the polygon scan with tx hash => ${txHash}`
                    );
                  }}
                >
                  {txHash}
                </div>
              </div>
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
