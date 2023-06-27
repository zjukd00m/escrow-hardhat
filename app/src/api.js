const API_URL = "http://localhost:8090";

const headers = { "Content-Type": "application/json" };

const createUser = (userWallet) => fetch(`${API_URL}/api/users`, {
        headers,
        body: JSON.stringify({ userWallet }),
        method: "POST",
    })
    .then((res) => res.json());

const addContract = ({
    contractAddress,
    arbiter,
    beneficiary,
    deployer,
    value,
    txHash,
}) => fetch(`${API_URL}/api/contracts`, {
        headers,
        body: JSON.stringify({
            contractAddress,
            arbiter,
            beneficiary,
            deployer,
            value,
            txHash,
        }),
        method: "POST",
    })
        .then((res) => res.json());

const getUserContracts = (userWallet) => fetch(`${API_URL}/api/contracts?userAddress=${userWallet}`)
        .then((res) => res.json());

const userExist = (userWallet) => fetch(`${API_URL}/api/users/${userWallet}`)
    .then((res) => res.json());


export { createUser, addContract, getUserContracts, userExist };