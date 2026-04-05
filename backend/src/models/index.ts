import {
  Sequelize,
  DataTypes,
  Model,
  fn,
  col,
  where,
} from "sequelize";
import type { Config } from "../config.js";

export class User extends Model {
  declare id: number;
  declare email: string;
  declare passwordHash: string;
  declare role: string;
  declare twoFactorEnabled: boolean;
  declare readonly createdAt: Date;
}

/** Short-lived email OTP for login 2FA, password change, and 2FA toggles. */
export class SecurityOtpChallenge extends Model {
  declare id: number;
  declare userId: number;
  declare purpose: string;
  declare codeHash: string;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
}

export class ClassRoom extends Model {
  declare id: number;
  declare name: string;
  declare gradeLevel: string | null;
  declare academicYear: string;
  declare readonly createdAt: Date;
}

export class Student extends Model {
  declare id: number;
  declare admissionNumber: string;
  declare firstName: string;
  declare lastName: string;
  declare dateOfBirth: string | null;
  declare parentEmail: string | null;
  declare classRoomId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export class PasswordResetOtp extends Model {
  declare id: number;
  declare emailLower: string;
  declare codeHash: string;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
}

/** In-app notifications for a user (header bell). */
export class UserNotification extends Model {
  declare id: number;
  declare userId: number;
  declare title: string;
  declare body: string;
  /** Null = unread. */
  declare readAt: Date | null;
  declare readonly createdAt: Date;
}

/** In-app messages for a user (header mail). */
export class UserMessage extends Model {
  declare id: number;
  declare recipientUserId: number;
  declare senderUserId: number | null;
  /** List headline (e.g. sender name); required even if sender_user_id is set. */
  declare title: string;
  declare body: string;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
}

export function setupDatabase(config: Config): Sequelize {
  const sequelize = new Sequelize({
    dialect: "mysql",
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASSWORD === "" ? undefined : config.DB_PASSWORD,
    database: config.DB_NAME,
    logging: config.NODE_ENV === "development" ? console.log : false,
  });

  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      // Uniqueness: DB `uq_users_email` (schema.sql). Omit `unique: true` here so
      // `sequelize.sync({ alter: true })` does not emit CHANGE … UNIQUE and hit MySQL
      // ER_TOO_MANY_KEYS when a unique index already exists.
      email: { type: DataTypes.STRING(255), allowNull: false },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "admin",
      },
      twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "two_factor_enabled",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
      timestamps: false,
    },
  );

  ClassRoom.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(120), allowNull: false },
      gradeLevel: { type: DataTypes.STRING(50), field: "grade_level" },
      academicYear: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: "academic_year",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "classrooms",
      modelName: "ClassRoom",
      timestamps: false,
    },
  );

  Student.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      admissionNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "admission_number",
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "last_name",
      },
      dateOfBirth: { type: DataTypes.DATEONLY, field: "date_of_birth" },
      parentEmail: { type: DataTypes.STRING(255), field: "parent_email" },
      classRoomId: {
        type: DataTypes.INTEGER.UNSIGNED,
        field: "class_room_id",
      },
    },
    {
      sequelize,
      tableName: "students",
      modelName: "Student",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  // DB uses CONSTRAINT fk_students_classroom (schema.sql). Sequelize alter-sync
  // assumes default names like students_ibfk_1 and throws UnknownConstraintError
  // if they differ — so we keep the real FK in SQL and skip Sequelize FK DDL.
  Student.belongsTo(ClassRoom, {
    foreignKey: "class_room_id",
    as: "classRoom",
    constraints: false,
  });
  ClassRoom.hasMany(Student, {
    foreignKey: "class_room_id",
    as: "students",
    constraints: false,
  });

  PasswordResetOtp.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      emailLower: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "email_lower",
      },
      codeHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "code_hash",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "password_reset_otps",
      modelName: "PasswordResetOtp",
      timestamps: false,
    },
  );

  SecurityOtpChallenge.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "user_id",
      },
      purpose: { type: DataTypes.STRING(32), allowNull: false },
      codeHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "code_hash",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "security_otp_challenges",
      modelName: "SecurityOtpChallenge",
      timestamps: false,
    },
  );

  SecurityOtpChallenge.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
    constraints: false,
  });
  User.hasMany(SecurityOtpChallenge, {
    foreignKey: "user_id",
    as: "securityOtpChallenges",
    constraints: false,
  });

  UserNotification.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "user_id",
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      readAt: { type: DataTypes.DATE, field: "read_at", allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "user_notifications",
      modelName: "UserNotification",
      timestamps: false,
    },
  );

  UserMessage.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      recipientUserId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "recipient_user_id",
      },
      senderUserId: {
        type: DataTypes.INTEGER.UNSIGNED,
        field: "sender_user_id",
        allowNull: true,
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      readAt: { type: DataTypes.DATE, field: "read_at", allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "user_messages",
      modelName: "UserMessage",
      timestamps: false,
    },
  );

  // FK names in db/schema.sql differ from Sequelize defaults; keep DDL in SQL only.
  UserNotification.belongsTo(User, {
    foreignKey: "user_id",
    as: "recipient",
    constraints: false,
  });
  User.hasMany(UserNotification, {
    foreignKey: "user_id",
    as: "notifications",
    constraints: false,
  });

  UserMessage.belongsTo(User, {
    foreignKey: "recipient_user_id",
    as: "recipient",
    constraints: false,
  });
  UserMessage.belongsTo(User, {
    foreignKey: "sender_user_id",
    as: "sender",
    constraints: false,
  });
  User.hasMany(UserMessage, {
    foreignKey: "recipient_user_id",
    as: "receivedMessages",
    constraints: false,
  });
  User.hasMany(UserMessage, {
    foreignKey: "sender_user_id",
    as: "sentMessages",
    constraints: false,
  });

  return sequelize;
}

/** Case-insensitive email match (same idea as SQL LOWER(email) = LOWER(?)). */
export function userByEmailCi(normalized: string) {
  return User.findOne({
    where: where(fn("LOWER", col("email")), fn("LOWER", normalized)),
  });
}
