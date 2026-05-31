import { Response } from 'express';
import { ApiResponse, Message } from '../types';
import { UserRole } from '../types';
import { sequelize } from '../database/connection';

export class MessageController {
  async getMessages(req: any, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, unread_only = false } = req.query;
      const userRole = req.user.role;
      const userId = req.user.userId;

      console.log('🔍 Getting messages for role:', userRole, 'userId:', userId);

      // Homeroom teachers and Guardians can message each other
      if (userRole !== UserRole.GUARDIAN && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only guardians and homeroom teachers can access messages',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      let query = '';
      let replacements: any[] = [];

      // Build query based on user role
      if (userRole === UserRole.GUARDIAN) {
        // Guardian can ONLY see messages with their children's homeroom teachers
        query = `
          SELECT m.message_id, m.sender_id, m.receiver_id, m.content, m.sent_at, m.is_read, m.message_type,
                 u.full_name as sender_name, u.role as sender_role
          FROM messages m
          JOIN users u ON m.sender_id = u.user_id
          WHERE (m.receiver_id = ? OR m.sender_id = ?)
          AND (
            CASE 
              WHEN m.sender_id = ? THEN m.receiver_id
              ELSE m.sender_id
            END
          ) IN (
            SELECT DISTINCT c.homeroom_teacher_id 
            FROM "Classrooms" c 
            JOIN "Students" s ON s.class_id = c.class_id 
            WHERE s.guardian_id = ?
          )
          ORDER BY m.sent_at DESC
          LIMIT ? OFFSET ?
        `;
        replacements = [userId, userId, userId, userId, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string)];
      } else if (userRole === UserRole.HOMEROOM_TEACHER) {
        // Homeroom teacher can ONLY see messages with their children's guardians
        query = `
          SELECT m.message_id, m.sender_id, m.receiver_id, m.content, m.sent_at, m.is_read, m.message_type,
                 u.full_name as sender_name, u.role as sender_role
          FROM messages m
          JOIN users u ON m.sender_id = u.user_id
          WHERE (m.receiver_id = ? OR m.sender_id = ?)
          AND (
            CASE 
              WHEN m.sender_id = ? THEN m.receiver_id
              ELSE m.sender_id
            END
          ) IN (
            SELECT DISTINCT s.guardian_id 
            FROM "Students" s 
            JOIN "Classrooms" c ON s.class_id = c.class_id 
            WHERE c.homeroom_teacher_id = ? AND s.guardian_id IS NOT NULL
          )
          ORDER BY m.sent_at DESC
          LIMIT ? OFFSET ?
        `;
        replacements = [userId, userId, userId, userId, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string)];
      }

      const [messages] = await sequelize.query(query, { replacements });

      console.log('📊 Messages loaded:', (messages as any[]).length);

      const response: ApiResponse = {
        success: true,
        data: {
          messages: (messages as any[]).map(msg => ({
            messageId: msg.message_id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            sentAt: msg.sent_at,
            isRead: msg.is_read,
            messageType: msg.message_type,
            senderName: msg.sender_name,
            senderRole: msg.sender_role,
          })),
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: (messages as any[]).length,
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_MESSAGES_FAILED',
          message: 'Failed to fetch messages',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async sendMessage(req: any, res: Response): Promise<void> {
    try {
      const { receiverId, content, messageType = 'general' } = req.body;
      const senderId = req.user.userId;
      const senderRole = req.user.role;

      console.log('📤 Sending message from role:', senderRole, 'to userId:', receiverId);

      // Homeroom teachers and Guardians can message each other
      if (senderRole !== UserRole.GUARDIAN && senderRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only guardians and homeroom teachers can send messages',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify receiver exists and get their role
      const [users] = await sequelize.query(`
        SELECT user_id, role FROM users WHERE user_id = ? AND is_active = true
      `, {
        replacements: [receiverId]
      });

      const receiver = (users as any[])[0];
      
      if (!receiver) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECEIVER_NOT_FOUND',
            message: 'Receiver not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate messaging relationship: homeroom teacher ↔ guardian of their child
      if (senderRole === UserRole.GUARDIAN) {
        const [allowed] = await sequelize.query(`
          SELECT 1 FROM "Classrooms" c
          JOIN "Students" s ON s.class_id = c.class_id
          WHERE s.guardian_id = ? AND c.homeroom_teacher_id = ?
          LIMIT 1
        `, {
          replacements: [senderId, receiverId]
        });
        if ((allowed as any[]).length === 0) {
          res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'You can only message your child\'s homeroom teacher.',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
      } else if (senderRole === UserRole.HOMEROOM_TEACHER) {
        const [allowed] = await sequelize.query(`
          SELECT 1 FROM "Students" s
          JOIN "Classrooms" c ON s.class_id = c.class_id
          WHERE c.homeroom_teacher_id = ? AND s.guardian_id = ?
          LIMIT 1
        `, {
          replacements: [senderId, receiverId]
        });
        if ((allowed as any[]).length === 0) {
          res.status(403).json({
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'You can only message guardians of students in your homeroom classroom.',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Create message
      const [result] = await sequelize.query(`
        INSERT INTO messages (sender_id, receiver_id, content, message_type, sent_at, is_read)
        VALUES (?, ?, ?, ?, NOW(), false)
        RETURNING message_id
      `, {
        replacements: [senderId, receiverId, content, messageType]
      });

      const messageId = (result as any)[0].message_id;

      console.log('✅ Message created:', { messageId, senderRole, receiverRole: receiver.role });

      const response: ApiResponse = {
        success: true,
        data: {
          messageId: messageId,
          senderId,
          receiverId,
          content,
          messageType,
          sentAt: new Date(),
          isRead: false,
        },
        message: 'Message sent successfully',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEND_MESSAGE_FAILED',
          message: 'Failed to send message',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async markAsRead(req: any, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Homeroom teachers and Guardians can access messages
      if (userRole !== UserRole.GUARDIAN && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only guardians and homeroom teachers can access messages',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify message belongs to user
      const [messages] = await sequelize.query(`
        SELECT message_id FROM messages 
        WHERE message_id = ? AND (sender_id = ? OR receiver_id = ?)
      `, {
        replacements: [parseInt(messageId), userId, userId]
      });

      const message = (messages as any[])[0];
      
      if (!message) {
        res.status(404).json({
          success: false,
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Mark as read
      await sequelize.query(`
        UPDATE messages SET is_read = true WHERE message_id = ?
      `, {
        replacements: [parseInt(messageId)]
      });

      console.log('📖 Message marked as read:', messageId);

      const response: ApiResponse = {
        success: true,
        message: 'Message marked as read',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MARK_READ_FAILED',
          message: 'Failed to mark message as read',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Bulk-mark ALL messages from a partner as read in one query
  async markConversationRead(req: any, res: Response): Promise<void> {
    try {
      const { partnerId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== UserRole.GUARDIAN && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'Access denied' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Single UPDATE — marks every message sent by partnerId to me as read
      await sequelize.query(
        `UPDATE messages SET is_read = true
         WHERE sender_id = ? AND receiver_id = ? AND is_read = false`,
        { replacements: [parseInt(partnerId), userId] }
      );

      console.log('📖 Conversation marked as read — partner:', partnerId, 'user:', userId);

      res.status(200).json({
        success: true,
        message: 'Conversation marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Mark conversation read error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'MARK_READ_FAILED', message: 'Failed to mark conversation as read' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getConversations(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      console.log('💬 Getting conversations for role:', userRole);

      // Homeroom teachers and Guardians can access conversations
      if (userRole !== UserRole.GUARDIAN && userRole !== UserRole.HOMEROOM_TEACHER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Only guardians and homeroom teachers can access conversations',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      let query = '';
      let replacements: any[] = [];

      // Get conversations based on user role
      if (userRole === UserRole.GUARDIAN) {
        // Guardian sees conversations strictly with their children's homeroom teachers
        query = `
          SELECT DISTINCT u.user_id, u.full_name, u.role,
                 (SELECT m.content FROM messages m 
                  WHERE ((m.sender_id = ? AND m.receiver_id = u.user_id) OR 
                         (m.receiver_id = ? AND m.sender_id = u.user_id))
                  AND m.message_type != 'report_card'
                  ORDER BY m.sent_at DESC LIMIT 1) as last_message_content,
                 (SELECT m.sent_at FROM messages m 
                  WHERE ((m.sender_id = ? AND m.receiver_id = u.user_id) OR 
                         (m.receiver_id = ? AND m.sender_id = u.user_id))
                  AND m.message_type != 'report_card'
                  ORDER BY m.sent_at DESC LIMIT 1) as last_message_sent_at,
                 (SELECT COUNT(*) FROM messages m 
                  WHERE m.receiver_id = ? AND m.sender_id = u.user_id AND m.is_read = false
                  AND m.message_type != 'report_card') as unread_count
          FROM users u
          JOIN messages m ON (m.sender_id = u.user_id OR m.receiver_id = u.user_id)
          WHERE u.role = 'homeroom_teacher'
          AND m.message_type != 'report_card'
          AND (m.sender_id = ? OR m.receiver_id = ?)
          AND u.user_id != ?
          AND u.user_id IN (
            SELECT DISTINCT c.homeroom_teacher_id 
            FROM "Classrooms" c 
            JOIN "Students" s ON s.class_id = c.class_id 
            WHERE s.guardian_id = ?
          )
          GROUP BY u.user_id, u.full_name, u.role
        `;
        replacements = [userId, userId, userId, userId, userId, userId, userId, userId, userId];
      } else if (userRole === UserRole.HOMEROOM_TEACHER) {
        // Homeroom teacher sees conversations strictly with their children's guardians
        query = `
          SELECT DISTINCT u.user_id, u.full_name, u.role,
                 (SELECT m.content FROM messages m 
                  WHERE ((m.sender_id = ? AND m.receiver_id = u.user_id) OR 
                         (m.receiver_id = ? AND m.sender_id = u.user_id))
                  AND m.message_type != 'report_card'
                  ORDER BY m.sent_at DESC LIMIT 1) as last_message_content,
                 (SELECT m.sent_at FROM messages m 
                  WHERE ((m.sender_id = ? AND m.receiver_id = u.user_id) OR 
                         (m.receiver_id = ? AND m.sender_id = u.user_id))
                  AND m.message_type != 'report_card'
                  ORDER BY m.sent_at DESC LIMIT 1) as last_message_sent_at,
                 (SELECT COUNT(*) FROM messages m 
                  WHERE m.receiver_id = ? AND m.sender_id = u.user_id AND m.is_read = false
                  AND m.message_type != 'report_card') as unread_count
          FROM users u
          JOIN messages m ON (m.sender_id = u.user_id OR m.receiver_id = u.user_id)
          WHERE u.role = 'guardian'
          AND m.message_type != 'report_card'
          AND (m.sender_id = ? OR m.receiver_id = ?)
          AND u.user_id != ?
          AND u.user_id IN (
            SELECT DISTINCT s.guardian_id 
            FROM "Students" s 
            JOIN "Classrooms" c ON s.class_id = c.class_id 
            WHERE c.homeroom_teacher_id = ? AND s.guardian_id IS NOT NULL
          )
          GROUP BY u.user_id, u.full_name, u.role
        `;
        replacements = [userId, userId, userId, userId, userId, userId, userId, userId, userId];
      }

      const [conversations] = await sequelize.query(query, { replacements });

      console.log('📊 Conversations loaded:', (conversations as any[]).length);

      const response: ApiResponse = {
        success: true,
        data: {
          conversations: (conversations as any[]).map(conv => ({
            userId: conv.user_id,
            fullName: conv.full_name,
            role: conv.role,
            lastMessage: {
              content: conv.last_message_content,
              sentAt: conv.last_message_sent_at,
              isRead: false, // This would be calculated based on the last message
            },
            unreadCount: conv.unread_count || 0,
          })),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CONVERSATIONS_FAILED',
          message: 'Failed to fetch conversations',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
