// scripts/deploy.js
import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🚀 Deploying MakeMeFamous contracts to Polygon...");
  
  // Debug: Check if we have signers
  const signers = await ethers.getSigners();
  console.log("Number of signers:", signers.length);
  
  if (signers.length === 0) {
    throw new Error("No accounts configured. Please check your PRIVATE_KEY in .env file");
  }
  
  // Get the deployer account
  const [deployer] = signers;
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");
  
  // Deploy SocialTokenFactory with gas optimization
  console.log("\n📄 Deploying SocialTokenFactory...");
  const SocialTokenFactory = await ethers.getContractFactory("SocialTokenFactory");
  
  // Deploy with higher gas limit
  const factory = await SocialTokenFactory.deploy({
    gasLimit: 5000000,  // Increased gas limit
    gasPrice: ethers.parseUnits("50", "gwei")  // Higher gas price for faster confirmation
  });
  
  console.log("⏳ Waiting for deployment confirmation...");
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ SocialTokenFactory deployed to:", factoryAddress);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalTokens = await factory.totalTokensCreated();
  console.log("Total tokens created:", totalTokens.toString());
  
  // Display contract info
  console.log("\n📋 Contract Information:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏭 Factory Address:", factoryAddress);
  console.log("💰 Creation Fee:", ethers.formatEther(await factory.CREATION_FEE()), "MATIC");
  console.log("📊 Platform Fee:", (await factory.PLATFORM_FEE_PERCENT()).toString() / 100, "%");
  console.log("🔢 Max Tokens per User:", (await factory.MAX_TOKENS_PER_USER()).toString());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Save deployment info
  const deploymentInfo = {
    network: "polygon", // Change to "polygonAmoy" for testnet
    factoryAddress: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    creationFee: ethers.formatEther(await factory.CREATION_FEE()),
    platformFeePercent: (await factory.PLATFORM_FEE_PERCENT()).toString()
  };
  
  // You can save this to a file or use it in your frontend
  console.log("\n💾 Deployment Info (save this for frontend):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Next steps:");
  console.log("1. Save the factory address in your frontend config");
  console.log("2. Verify contracts on PolygonScan");
  console.log("3. Test token creation functionality");
}

// Run deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });