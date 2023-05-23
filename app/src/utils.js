import { ethers } from 'ethers';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';

// Provider functions

export const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function deploy(signer, arbiter, beneficiary, value) {
  if (
    !(signer !== arbiter && arbiter !== beneficiary && signer !== beneficiary)
  )
    return;

  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );

  const contract = await factory.deploy(arbiter, beneficiary, { value });

  return contract;
}

export async function getTransactionCountByUser(userAddress) {
  const txCount = await provider.getTransactionCount(userAddress);
  return txCount;
}

export async function getTransactionData(txHash) {
  const txData = await provider.getTransaction(txHash);
  return txData;
}

// Get the user balance in WEI
export async function getUserBalance(contract, userAddress) {
  const userBalance = await contract.balanceOf(userAddress);
  return ethers.utils.formatUnits(userBalance, 'wei');
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
  const event = ethers.utils.toUtf8Bytes(
    'ContractDeployed(address,address,address,uint256)'
  );
  const eventSignature = ethers.utils.keccak256(event);

  const filters = {
    fromBlock: 'earliest',
    toBlock: 'latest',
    address: null,
    topics: [
      eventSignature,
      ethers.utils.hexZeroPad(userAddress, 32),
      null,
      null,
    ],
  };

  // Get the event logs generated first by:
  // - Contract deployer
  // - Arbiter
  // - Beneficiary
  try {
    // Fetch events as contract deployer
    let eventLogs = await provider.getLogs(filters);

    // Fetch events as arbiter
    filters.topics[1] = null;
    const eventLogsAsArbiter = await provider.getLogs({
      ...filters,
      topics: [
        eventSignature,
        null,
        ethers.utils.hexZeroPad(userAddress, 32),
        null,
      ],
    });

    // Fetch events as beneficiary
    filters.topics[1] = null;
    const eventLogsAsBeneficiary = await provider.getLogs({
      ...filters,
      topics: [
        eventSignature,
        null,
        null,
        ethers.utils.hexZeroPad(userAddress, 32),
      ],
    });

    eventLogs = [
      ...eventLogs,
      ...eventLogsAsArbiter,
      ...eventLogsAsBeneficiary,
    ];

    const contractData = [];

    for (let i = 0; i < eventLogs?.length; i++) {
      const eventLog = eventLogs[i];
      // The event data is the concatenation of the hashed (keccak256) topics
      const eventData = eventLog.data;

      const eventInterface = new ethers.utils.Interface(Escrow.abi);
      const decodedData = eventInterface.decodeEventLog(
        'ContractDeployed',
        eventData
      );

      if (!decodedData?.length) continue;

      contractData.push({
        address: eventLog.address,
        arbiter: decodedData[1],
        beneficiary: decodedData[2],
        value: ethers.utils.formatUnits(decodedData[3], 'wei'),
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
    console.log({ isApproved });
    return isApproved;
  } catch (error) {
    return false;
  }
}
