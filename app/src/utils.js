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

// Contract functions

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

export async function isContractApproved(address) {
  const escrowContract = new ethers.Contract(address, Escrow.abi, provider);

  const isApproved = await escrowContract.isApproved();

  return isApproved;
}