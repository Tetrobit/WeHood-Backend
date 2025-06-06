import 'express-async-errors';
import "reflect-metadata";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.routes";
import telemetryRoutes from "./routes/telemetry.routes";
import * as path from "path";
import utilsRoutes from "./routes/utils.routes";
import geocodingRoutes from "./routes/geocoding.routes";
import weatherRoutes from "./routes/weather.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import nearbyRoutes from "./routes/nearby.routes";
import notificationRoutes from "./routes/notification.routes";
import pollRoutes from "./routes/poll.routes";
import { softAuthMiddleware } from './middleware/auth.middleware';
import bodyParser from "body-parser";
config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Настройка EJS
app.use(softAuthMiddleware);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/geocoding", geocodingRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/nearby", nearbyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/polls", pollRoutes);

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
