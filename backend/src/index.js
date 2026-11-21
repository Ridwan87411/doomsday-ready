import { createApp } from "./app.js";
import { seedData } from "./store/seed.js";

const PORT = Number(process.env.PORT) || 3000;

seedData();
const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});