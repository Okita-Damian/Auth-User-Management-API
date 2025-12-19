require("dotenv").config();
const connection = require("./config/db");
const app = require("./main");

const port = process.env.PORT || 3000;

// start server after DB connection
const startServer = async () => {
  try {
    await connection();
    app.listen(port, () => {
      console.log(`🚀🚀 server running on port ${port} ....`);
    });
  } catch (error) {
    console.error("❌ Startup failed", error.message);
    process.exit(1);
  }
};

startServer();
