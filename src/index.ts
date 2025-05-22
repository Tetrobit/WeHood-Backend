import "reflect-metadata";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.routes";
import * as path from "path";
import utilsRoutes from "./routes/utils.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import bodyParser from "body-parser";

config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/utils", utilsRoutes);

app.use(errorMiddleware);

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
