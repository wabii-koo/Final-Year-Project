import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.DB_URL || '', {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: false,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Initialize model associations (lazy loaded to avoid circular imports)
    const { initSystemLogAssociations } = require('../models/SystemLog');
    const { initClassroomAssociations } = require('../models/Classroom');
    const { initStudentAssociations } = require('../models/Student');
    
    initSystemLogAssociations();
    initClassroomAssociations();
    initStudentAssociations();
    
    // Ensure new models are loaded for sync
    require('../models/OTP');
    require('../models/PendingRegistration');

    console.log('Model associations initialized.');
    
    // Sync database models
    if (process.env.NODE_ENV === 'development') {
      // sync() creates tables if they don't exist, leaves existing data untouched
      await sequelize.sync();
      console.log('Database synchronized successfully.');
    }

    // Alter messages table to add deletion tracking columns if they don't exist
    try {
      await sequelize.query(`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE;
      `);
      await sequelize.query(`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE;
      `);
      console.log('Database columns for message deletion synchronized.');
    } catch (alterError) {
      console.error('Failed to alter messages table:', alterError);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('Database connection closed successfully.');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};
