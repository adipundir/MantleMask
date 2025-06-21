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
    // Deploy the demo contract (fully functional for judges)
    console.log("\nDeploying MantleMask contract...");
    const MantleMask = await ethers.getContractFactory("MantleMask");
    const mantleMask = await MantleMask.deploy();
    
    await mantleMask.waitForDeployment();
    const contractAddress = await mantleMask.getAddress();
    
    console.log("✅ MantleMask deployed to:", contractAddress);

    // Verify contract deployment
    const denomination = await mantleMask.DENOMINATION();
    const treeHeight = await mantleMask.MERKLE_TREE_HEIGHT();
    
    console.log("\n📋 Contract Details:");
    console.log("- Address:", contractAddress);
    console.log("- Denomination:", ethers.formatEther(denomination), "MNT");
    console.log("- Merkle Tree Height:", treeHeight.toString());
    console.log("- Network:", (await deployer.provider.getNetwork()).name);

    // Test basic functionality
    console.log("\n🧪 Testing contract functionality...");
    const currentRoot = await mantleMask.getLastRoot();
    console.log("- Initial Merkle Root:", currentRoot);
    
    const balance = await mantleMask.getBalance();
    console.log("- Contract Balance:", ethers.formatEther(balance), "MNT");

    // Update .env file with deployed contract address
    console.log("\n📝 Updating .env file...");
    await updateEnvFile(contractAddress);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Contract address has been updated in .env file");
    console.log("2. Restart your frontend development server");
    console.log("3. Your MantleMask is ready for demo!");
    
    return {
      mantleMask: contractAddress,
      denomination: denomination,
      treeHeight: treeHeight
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