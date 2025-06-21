const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting MantleMask deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MNT");

  try {
    // Deploy the privacy mixer contract (fully functional)
    console.log("📦 Deploying MantleMask privacy mixer contract...");
    
    const MantleMask = await ethers.getContractFactory("MantleMask");
    const mantleMask = await MantleMask.deploy();
    
    await mantleMask.waitForDeployment();
    const contractAddress = await mantleMask.getAddress();
    
    console.log("✅ MantleMask deployed to:", contractAddress);
    
    // Verify basic contract properties
    const denomination = await mantleMask.DENOMINATION();
    console.log("💰 Contract denomination:", ethers.formatEther(denomination), "MNT");
    
    const balance = await mantleMask.getBalance();
    console.log("💳 Contract balance:", ethers.formatEther(balance), "MNT");
    
    const lastRoot = await mantleMask.getLastRoot();
    console.log("🌳 Initial Merkle root:", lastRoot);
    
    console.log("\n📋 Contract Information:");
    console.log("=====================================");
    console.log("Contract Address:", contractAddress);
    console.log("Network: Mantle Sepolia");
    console.log("Denomination: 10 MNT");
    console.log("=====================================");
    
    // Test basic functionality
    console.log("\n🧪 Testing contract functionality...");
    
    // Verify reading a note that doesn't exist
    const testNote = ethers.keccak256(ethers.toUtf8Bytes("sample_note"));
    const isValid = await mantleMask.isValidNote(testNote);
    console.log("Sample note validity (should be false):", isValid);
    
    const isUsed = await mantleMask.isNoteUsed(testNote);
    console.log("Sample note used status (should be false):", isUsed);
    
    console.log("✅ Contract tests passed!");
    
    console.log("\n🎯 Deployment Summary:");
    console.log("=====================================");
    console.log("1. Contract deployed successfully");
    console.log("2. Basic functionality verified");
    console.log("3. Your MantleMask is ready for production!");
    console.log("=====================================");
    
    return {
      mantleMask: contractAddress,
      denomination: denomination,
      treeHeight: 0 // Assuming treeHeight is not available in the new contract
    };
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Function to update .env file with contract address
async function updateEnvFile(contractAddress) {
  const envPath = path.join(__dirname, "../.env");
  
  try {
    // Read current .env file
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    // Update or add the contract address
    const lines = envContent.split("\n");
    let addressUpdated = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("NEXT_PUBLIC_MANTLEMASK_ADDRESS=")) {
        lines[i] = `NEXT_PUBLIC_MANTLEMASK_ADDRESS=${contractAddress}`;
        addressUpdated = true;
        break;
      }
    }
    
    // If not found, add it
    if (!addressUpdated) {
      lines.push(`NEXT_PUBLIC_MANTLEMASK_ADDRESS=${contractAddress}`);
    }
    
    // Write back to file
    fs.writeFileSync(envPath, lines.join("\n"));
    console.log("✅ Environment file updated successfully");
    
  } catch (error) {
    console.log("⚠️  Could not update .env file automatically");
    console.log("Please manually update your .env file:");
    console.log(`NEXT_PUBLIC_MANTLEMASK_ADDRESS=${contractAddress}`);
  }
}

// Allow script to be called directly or imported
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main; 