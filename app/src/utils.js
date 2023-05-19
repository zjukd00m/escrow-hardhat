import { ethers } from 'ethers';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';

// Provider functions

export const provider = new ethers.providers.Web3Provider(window.ethereum);

export default async function deploy(signer, arbiter, beneficiary, value) {
  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );
  return factory.deploy(arbiter, beneficiary, { value });
}

export async function getTransactionCountByUser(userAddress) {
  const txCount = await provider.getTransactionCount(userAddress)
  return txCount;
}

export async function getTransactionData(txHash) {
  const txData = await provider.getTransaction(txHash);
  return txData;
}

export function validateWalletAddress(walletAddress) {
  try {
    ethers.utils.getAddress(walletAddress);
    return { error: false };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

// Fetch the user deployed contracts via the event logs
export async function getTransacionsByUser(userAddress) {
  const event = ethers.utils.toUtf8Bytes("ContractDeployed(address,address,address,uint256)");
  const eventSignature = ethers.utils.keccak256(event);

  const filters = {
      fromBlock: "earliest",
      toBlock: "latest",
      address: null,
      topics: [
        eventSignature,
        ethers.utils.hexZeroPad(userAddress, 32),
      ]
  }

  try {
    const eventLogs = await provider.getLogs(filters);

    const contractData = [];

    for (let i = 0; i < eventLogs?.length; i++) {

      const eventLog = eventLogs[i];
      // The event data is the concatenation of the hashed (keccak256) topics
      const eventData = eventLog.data;

      const eventInterface = new ethers.utils.Interface(Escrow.abi);
      const decodedData = eventInterface.decodeEventLog("ContractDeployed", eventData)

      if (!decodedData?.length) continue;

      contractData.push({
        address: eventLog.address,
        arbiter: decodedData[1],
        beneficiary: decodedData[2],
        value: ethers.utils.formatEther(decodedData[3]),
        txHash: eventLog.transactionHash,
        blockHash: eventLog.blockHash,
        blockNumber: eventLog.blockNumber,
      });

    }

    return contractData;
  } catch (error) {
    return null;
  }
}

// Contract functions

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

export async function isContractApproved(address) {
  const escrowContract = new ethers.Contract(address, Escrow.abi, provider);

  try {
    const isApproved = await escrowContract.isApproved();
    return isApproved;
  } catch (error) {
    return false;
  }
}