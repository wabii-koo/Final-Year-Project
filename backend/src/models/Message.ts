import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Message } from '../types';

interface MessageCreationAttributes extends Optional<Message, 'messageId' | 'sentAt' | 'isRead' | 'readAt'> {}

export class MessageModel extends Model<Message, MessageCreationAttributes> implements Message {
  public messageId!: number;
  public senderId!: number;
  public receiverId!: number;
  public content!: string;
  public sentAt!: Date;
  public isRead!: boolean;
  public readAt?: Date;
  public messageType!: 'homework' | 'general' | 'report_card' | 'pickup';
  public deletedBySender?: boolean;
  public deletedByReceiver?: boolean;
}

MessageModel.init(
  {
    messageId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'message_id',
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'Users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'receiver_id',
      references: {
        model: 'Users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'content',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'sent_at',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    messageType: {
      type: DataTypes.ENUM('homework', 'general', 'report_card', 'pickup'),
      allowNull: false,
      defaultValue: 'general',
      field: 'message_type',
    },
    deletedBySender: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'deleted_by_sender',
    },
    deletedByReceiver: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'deleted_by_receiver',
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true,
    createdAt: 'sentAt',
    updatedAt: false,
  }
);

export default MessageModel;
