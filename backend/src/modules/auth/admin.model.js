
import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const Admin = sequelize.define(
    "Admin",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },

        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },

        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true
        },

        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        role: {
            type: DataTypes.ENUM("super_admin", "admin"),
            defaultValue: "admin"
        },

        status: {
            type: DataTypes.ENUM(
                "active",
                "inactive",
                "blocked"
            ),
            defaultValue: "active"
        },

        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        tableName: "admins",
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
);

export default Admin;
