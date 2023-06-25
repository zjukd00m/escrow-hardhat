const express = require("express");
const helmet = require("helmet");
const http = require("http");
const mongoose = require("mongoose");
const ethers = require("ethers");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config({ path: "./.env" });

const MONGO_URL = process.env.POLYGON_ESCROW_MONGO_URL;

// --- Schema definition for the ORM
const UserSchema = new mongoose.Schema({ 
    wallet: { type: String, required: true },
});

const User = mongoose.model("Users", UserSchema);

const ContractSchema = new mongoose.Schema({
    address: { type: String, required: true },
    wallets: { type: [String], required: true },
    value: { type: String, required: true },
});

const Contract = mongoose.model("Contracts", ContractSchema);


// --- REST API
async function main() {
    await mongoose.connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: "polygon-escrow-db",
    })

    const app = express();

    app.use(morgan("dev"));
    app.use(helmet());
    app.use(express.json());
    app.use(cors({
        origin: ["http://localhost:3000"],
    }));


    // --- Mongo REST API
    // Register a new user with its wallet public address
    app.post("/api/users", async (req, res) => {
        if (!req.body.userWallet) {
            return res.sendStatus(422);
        }

        const { userWallet } = req.body;

        if (!ethers.isAddress(userWallet))
            return res.status(404).json({
                message: "Invalid wallet address",
            });

        try {

            const existingUser = await User.findOne({ wallet: userWallet.trim().toLowerCase() });

            if (existingUser) {
                return res.status(400).json({
                    message: "There's an existing user with that address"
                });
            }

            const user = await User.create({
                wallet: userWallet.trim().toLowerCase(),
            });

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: { message: error.message } });
        }
    });

    // Get all user contracts
    app.get("/api/contracts", async (req, res) => {
        const { userAddress } = req.query;

        if (!userAddress) {
            return res.sendStatus(422);
        }

        if (!ethers.isAddress(userAddress)) {
            return res.sendStatus(422);
        }

        try {
            const contracts = await Contract.find({ wallets: { $in: [userAddress.trim().toLowerCase()] } }).exec();

            res.json({ contracts });
        } catch (error) {
            res.status(500).json({ error: { message: error.message } });
        }
    });

    // Register a new contract that was recently minted
    app.post("/api/contracts", async (req, res) => {
        let {
            contractAddress,
            arbiter,
            beneficiary,
            deployer,
            value,
        } = req.body;

        console.log(req.body)

        if (
            !contractAddress?.length ||
            !arbiter?.length ||
            !beneficiary?.length ||
            !deployer?.length ||
            !value?.length
        ) {
            return res.sendStatus(422);
        }

        // Validate the address list has only valid ethereum ones
        const validAddresses = [arbiter, beneficiary, deployer].map((address) => ethers.isAddress(address));

        if (!validAddresses.every(element => element === true)) {
            return res.sendStatus(422);
        }

        arbiter = arbiter.trim().toLowerCase();
        beneficiary = beneficiary.trim().toLowerCase();
        deployer = deployer.trim().toLowerCase();

        try {
            const contract = new Contract({
                address: contractAddress,
                wallets: [arbiter, beneficiary, deployer],
                value,
            });

            res.status(201).json(await contract.save());
        } catch (error) {
            res.status(500).json({ error: { message: error.message } });
        }
    });

    // Does the given account exist ?
    app.get("/api/users/:userAddress", async (req, res) => {
        const userAddress = req.params.userAddress;

        if (!userAddress?.length)
            return res.sendStatus(422);

        if (!ethers.isAddress(userAddress))
            return res.sendStatus(422);

        try {
            const userExist = await User.exists({
                wallet: userAddress.trim().toLowerCase(),
            });

            const value = userExist?._id?.toString()?.length ? true : false;

            res.send({ userExist: value });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });

    const server = http.createServer(app);

    server.listen(8090, "localhost", () => console.log("..."));
}

main();
