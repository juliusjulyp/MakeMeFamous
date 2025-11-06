// scripts/deploy-debug.js
import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🔍 Debug deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
  
  try {
    console.log("\n📄 Getting contract factory...");
    const SocialTokenFactory = await ethers.getContractFactory("SocialTokenFactory");
    
    console.log("📄 Estimating gas...");
    const deploymentTx = await SocialTokenFactory.getDeployTransaction();
    const gasEstimate = await ethers.provider.estimateGas(deploymentTx);
    console.log("Estimated gas:", gasEstimate.toString());
    
    console.log("📄 Deploying with automatic gas...");
    const factory = await SocialTokenFactory.deploy();
    
    console.log("⏳ Waiting for deployment...");
    const receipt = await factory.waitForDeployment();
    
    const address = await factory.getAddress();
    console.log("✅ Deployed to:", address);
    
    // Test basic functions
    console.log("\n🧪 Testing contract...");
    const creationFee = await factory.CREATION_FEE();
    console.log("Creation fee:", ethers.formatEther(creationFee), "MATIC");
    
    const platformFee = await factory.PLATFORM_FEE_PERCENT();
    console.log("Platform fee:", platformFee.toString(), "basis points");
    
    console.log("\n🎉 Deployment successful!");
    
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    if (error.receipt) {
      console.error("Transaction hash:", error.receipt.hash);
      console.error("Gas used:", error.receipt.gasUsed.toString());
      console.error("Status:", error.receipt.status);
    }
    
    // Try to get revert reason
    if (error.transaction) {
      try {
        const tx = await ethers.provider.getTransaction(error.transaction.hash);
        const result = await ethers.provider.call(tx);
        console.error("Revert reason:", result);
      } catch (e) {
        console.error("Could not get revert reason");
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });