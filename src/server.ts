import { createApp } from "./app";
import { env } from "./config/env";
import { initializeDatabase } from "./config/database";

const bootstrap = async (): Promise<void> => {
  try {
    await initializeDatabase();
    const app = await createApp();

    app.listen(env.port, () => {
      console.log(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void bootstrap();
