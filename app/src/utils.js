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

// Get the user balance in WEI in the given contract
export async function getContractUserBalance(contract, userAddress) {
  const userBalance = await contract.getBalance(userAddress);
  return ethers.utils.formatUnits(userBalance, 'wei');
}

export async function getUserBalance(userAddress) {
  const userBalance = await provider.getBalance(userAddress);
  return ethers.utils.formatEther(userBalance);
}

export function validateWalletAddress(walletAddress) {
  try {
    ethers.utils.getAddress(walletAddress);
    return { error: false };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

// TODO: How to know the contract has been mined
export async function isContractDeployed(txHash, contractAddress) {
  const contract = new ethers.Contract(contractAddress, Escrow.abi, provider);

  // const event = ethers.utils.toUtf8Bytes(
  // 'ContractDeployed(address,address,address,uint256)'
  // );
  // const eventSignature = ethers.utils.keccak256(event);

  try {
    // const contractLogs = await provider.getLogs({
    //   address: contractAddress,
    //   fromBlock: 'earliest',
    //   toBlock: 'latest',
    //   topics: [eventSignature, null, null, null],
    // });
    const lastBlockNumber = await provider.getBlockNumber();

    console.log(contract?.deployTransaction?.blockNumber);

    // const x = await provider.getTransaction(contract.deployTransaction.);

    // console.log({ x });

    // const contractBlockNumber = contract.deployTransaction.A
    const contractBlock = await provider.getBlock(
      contract?.deployTransaction?.blockNumber
    );

    console.log({
      contracBlock: contractBlock.number,
      lastBlockNumber,
    });

    if (contractBlock.number <= lastBlockNumber) {
      console.log('---- The contract is mined');
    } else {
      console.error('----- The contract is not mined');
    }

    const contractLogs = await provider.getTransactionReceipt(txHash);

    // console.log({ contractLogs });

    if (
      contractLogs &&
      contractLogs.blockNumber?.toString()?.length &&
      contractLogs.blockHash?.length
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
    return null;
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

    const processedContracts = [];

    for (let i = 0; i < eventLogs?.length; i++) {
      const eventLog = eventLogs[i];

      // Make sure to include non repeated blocks
      if (processedContracts.includes(eventLog.address)) continue;
      else processedContracts.push(eventLog.address);

      // Verify the user address is included in the topics, skip if not
      if (!eventLog.topics?.includes(ethers.utils.hexZeroPad(userAddress, 32)))
        continue;

      // The event data is the concatenation of the hashed (keccak256) topics
      const eventData = eventLog.data;

      const eventInterface = new ethers.utils.Interface(Escrow.abi);
      const decodedData = eventInterface.decodeEventLog(
        'ContractDeployed',
        eventData
      );

      if (!decodedData?.length) continue;

      const _isApproved = await isContractApproved(eventLog.address);

      const _isMined = false;

      contractData.push({
        address: eventLog.address,
        arbiter: ethers.utils.hexStripZeros(eventLog.topics[2]),
        beneficiary: ethers.utils.hexStripZeros(eventLog.topics[3]),
        value: ethers.utils.formatUnits(decodedData[3], 'wei'),
        txHash: eventLog.transactionHash,
        blockHash: eventLog.blockHash,
        blockNumber: eventLog.blockNumber,
        _isApproved,
        _isMined,
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

export function getEthersContract(address) {
  return new ethers.Contract(address, Escrow.abi, provider);
}

// * This is one way to fetch the contract data from the blockchain
export async function getContractData(contract) {
  const { address } = contract;
  
  const escrow = new ethers.Contract(address, Escrow.abi, provider);
  
  const arbiter = await escrow.arbiter();
  const beneficiary = await escrow.beneficiary();
  let value = await provider.getBalance(address)

  return {
    arbiter,
    beneficiary,
    value,
    ...contract
  }
}