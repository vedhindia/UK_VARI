
import dotenv from "dotenv";
import app from "./app.js";
import sequelize from "./config/database.js";
import AdminPasswordReset from "./modules/auth/adminPasswordReset.model.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {

    try {

        await sequelize.authenticate();

        console.log("MySQL connected successfully");

        await AdminPasswordReset.sync();
        console.log("Admin password reset storage is ready");

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Database initialization failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();
