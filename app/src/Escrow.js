import { useEffect, useState } from "react";
import { getTransactionData, isContractApproved } from "./utils";

function copyToClipboard(address) {}

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  txHash,
  blockHash,
  blockNumber,
  handleApprove,
}) {

  const [expanded, setExpanded] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isMined, setIsMined] = useState(false);

  // Verify if the transaction is confirmed or pending
  useEffect(() => {
    (async () => {
      const txData = await getTransactionData(txHash);
      console.log(txData)

      // Verify the transaction is confirmed or mined
      if (txData.confirmations > 0) {
        setIsMined(true);
      } else {
        setIsMined(false);
      }

      // TODO: Verify the transaction has been approved
    })()
  }, []);

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
          <div className="flex items-center justify-between mb-3">
            <p className="text-grotesk text-sm md:text-md grow"> Contract address </p>
            {
              isMined ? (
                <div className="relative">
                  <div className="group">
                    <ion-icon name="alert-outline" style={{ color: "#ff5555" }}></ion-icon>
                    {/* <span className="bg-black inline group-hover:inline text-black text-xs text-mono rounded -left-1/2 bottom-full absolute p-1 bg-white opacity-90">
                      { txHash }
                    </span> */}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="group">
                    <ion-icon name="alert-outline" style={{ color: "#ff5555" }}></ion-icon>
                    {/* <span className="bg-black inline group-hover:inline text-black text-xs text-mono rounded left-1 top-0 absolute p-1 bg-white opacity-90">
                      The contract has not been deployed yet
                    </span> */}
                  </div>
                </div>
              )
            }
          </div>
          <div className="flex items-center gap-3">
            <p className="text-mono text-sm"> { address } </p>
            <ion-icon name="clipboard-outline" onClick={() => copyToClipboard(address)}></ion-icon>
          </div>
        </div>
        <div className="flex flex-row-reverse md:flex-col md:items-end items-center">
          <div className="md:mr-3 ml-[10em]" onClick={() => setExpanded(!expanded)}>
            <ion-icon name="chevron-down-outline"></ion-icon>
          </div>
          {
            isApproved ? (
              <div className="px-3 m-3 py-1 w-fit text-xs md:text-sm bg-green-100 text-black text-grotesk">
                <p className="text-xs"> Approved! </p>
              </div>
            ) : (
              <div
                className="px-3 py-1 bg-[#EBCB8B] text-black text-grotesk text-xs md:text-sm w-fit m-3 cursor-pointer"
                id={address}
                onClick={(e) => {
                  e.preventDefault();
                  handleApprove();
                }}
              >
                Approve
              </div>
            )
          }
        </div>
      </div>
      {
        expanded ? (
          <div className="border-b-2 border-slate-600 h-1 w-full px-4">
          </div>
        ) : null
      }
      <div className="bg-[#2E3440] w-full">
        {
          expanded ? (
            <ul className="">
              <li className="p-3">
                <div className="text-grotesk text-white uppercase text-sm mb-1"> Arbiter </div>
                <div className="text-white text-mono text-xs md:text-sm"> {arbiter} </div>
              </li>
              <li className="p-3">
                <div className="text-grotesk text-white uppercase text-sm mb-1"> Beneficiary </div>
                <div className="text-white text-mono md:text-sm text-xs"> {beneficiary} </div>
              </li>
              <li className="p-3">
                <div className="text-grotesk text-white uppercase text-sm mb-1"> Value (IN WEI) </div>
                <div className="text-white text-mono md:text-sm text-xs"> {value} </div>
              </li>
            </ul>
          ) : null
        }
        </div>
      </div>
  );
}
