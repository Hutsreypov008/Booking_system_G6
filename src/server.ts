import app from "./app";
import { initializeDatabase } from "./config/database";

const PORT = 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });
