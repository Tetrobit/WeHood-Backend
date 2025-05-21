import "reflect-metadata";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.routes";

config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("База данных успешно подключена");
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Ошибка при подключении к базе данных:", error);
  }); 