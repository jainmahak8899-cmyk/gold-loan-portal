import "dotenv/config";
import { CONFIG } from "./config";
import { connectDB } from "./db";
import { createApp } from "./app";

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Gold Loan API running on http://localhost:${CONFIG.PORT}`);
    console.log(`📋 Schemes: GET http://localhost:${CONFIG.PORT}/api/v1/loan-schemes`);
  });
}

main();
