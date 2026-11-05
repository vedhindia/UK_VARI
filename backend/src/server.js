
import dotenv from "dotenv";
import app from "./app.js";
import sequelize from "./config/database.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    try {

        await sequelize.authenticate();

        console.log("MySQL connected successfully");

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Database connection failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();
