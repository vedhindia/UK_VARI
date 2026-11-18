import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const AdminPasswordReset = sequelize.define(
    "AdminPasswordReset",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        admin_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: "admins",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        token_hash: {
            type: DataTypes.CHAR(64),
            allowNull: false,
            unique: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: "admin_password_resets",
        timestamps: false,
        indexes: [
            { fields: ["admin_id"] },
            { fields: ["expires_at"] }
        ]
    }
);

export default AdminPasswordReset;
