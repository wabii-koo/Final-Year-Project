'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Plus, 
  X, 
  MoreHorizontal, 
  ChevronDown, 
  SlidersHorizontal 
} from 'lucide-react'

interface Message {
  messageId: number
  senderId: number
  receiverId: number
  content: string
  sentAt: string
  isRead: boolean
  messageType: string
  senderName?: string
  senderRole?: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  
  // Tab state matching screenshot ("Focused" / "Other")
  const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused')

  const [students, setStudents] = useState<any[]>([])
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [searchStudentTerm, setSearchStudentTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedConversation])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchMessages()
    fetchConversations()
  }, [])

  useEffect(() => {
    if (user && user.role === 'homeroom_teacher') {
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/teacher/students?onlyHomeroom=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data || [])
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setMessages(data.data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setConversations(data.data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const token = localStorage.getItem('token')
      const receiverId = selectedConversation

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId,
          content: newMessage,
          messageType: 'general'
        }),
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        fetchMessages()
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const markAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      await fetch(`${apiUrl}/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.messageId === messageId ? { ...msg, isRead: true } : msg
        )
      )
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Mark all unread messages in a conversation as read
  const markConversationAsRead = async (partnerId: number) => {
    const token = localStorage.getItem('token')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    try {
      await fetch(`${apiUrl}/api/messages/conversations/${partnerId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      })
    } catch (error) {
      console.error('Error marking conversation as read:', error)
    }
    // Update local messages state
    setMessages(prev =>
      prev.map(msg =>
        msg.senderId === partnerId && msg.receiverId === user?.userId
          ? { ...msg, isRead: true }
          : msg
      )
    )
    // Clear unread badge in conversations list
    setConversations(prev =>
      prev.map(c => c.userId === partnerId ? { ...c, unreadCount: 0 } : c)
    )
  }

  const formatLastMessageDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}`
  }

  const getLastMessagePreview = (conversation: any) => {
    const thread = messages.filter(m => 
      ((m.senderId === user?.userId && m.receiverId === conversation.userId) ||
       (m.senderId === conversation.userId && m.receiverId === user?.userId)) &&
      m.messageType !== 'report_card'
    )
    if (thread.length > 0) {
      const latest = thread.reduce((latest, current) => 
        new Date(current.sentAt).getTime() > new Date(latest.sentAt).getTime() ? current : latest
      , thread[0])
      
      const isMe = latest.senderId === user?.userId
      const prefix = isMe ? 'You' : latest.senderName?.split(' ')[0] || conversation.fullName.split(' ')[0]
      return `${prefix}: ${latest.content}`
    }
    return conversation.lastMessage?.content || 'Start a conversation...'
  }

  const filteredMessages = messages.filter(message => 
    ((message.senderId === user?.userId && message.receiverId === selectedConversation) ||
     (message.senderId === selectedConversation && message.receiverId === user?.userId)) &&
    message.messageType !== 'report_card' &&
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filter === 'all' || (filter === 'unread' && !message.isRead) || (filter === 'read' && message.isRead))
  ).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-sm font-semibold">Loading messages...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow border border-gray-150 overflow-hidden">
        
        <div className="flex h-[600px]">
          {/* Conversations List (LinkedIn Style Layout) */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
            
            {/* Header section with User Profile & Icons */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    {user?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'ME'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                </div>
                <h1 className="text-md font-bold text-gray-900 tracking-tight">Messaging</h1>
              </div>
              
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
                {user?.role === 'homeroom_teacher' && (
                  <button 
                    onClick={() => setShowNewChatModal(true)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                    title="Compose Message"
                  >
                    <Plus size={18} />
                  </button>
                )}
                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Gray search pill */}
            <div className="p-3 border-b border-gray-100 bg-white">
              <div className="relative flex items-center bg-slate-100 rounded-lg px-3 py-2">
                <Search size={16} className="text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search messages"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none placeholder-gray-500"
                />
                <button className="text-gray-500 ml-2 hover:text-gray-700">
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Focused & Other tabs */}
            <div className="flex border-b border-gray-150 bg-white shrink-0">
              <button
                onClick={() => setActiveTab('focused')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'focused'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Focused
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'other'
                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Other
              </button>
            </div>

            {/* Scrollable conversation thread items */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {activeTab === 'other' ? (
                <div className="text-center py-12 text-xs text-gray-400 italic">
                  No other messages
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 italic font-bold">
                  No active chats
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isSelected = selectedConversation === conversation.userId
                  const lastMsgPreview = getLastMessagePreview(conversation)
                  const lastMsgDate = conversation.lastMessage?.sentAt 
                    ? formatLastMessageDate(conversation.lastMessage.sentAt) 
                    : ''

                  return (
                    <div
                      key={conversation.userId}
                      onClick={() => {
                        setSelectedConversation(conversation.userId)
                        markConversationAsRead(conversation.userId)
                      }}
                      className={`flex items-start gap-3 p-4 cursor-pointer transition-all border-l-4 ${
                        isSelected
                          ? 'bg-slate-50 border-emerald-600'
                          : 'hover:bg-slate-50/50 border-transparent'
                      }`}
                    >
                      {/* Avatar with status ring */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                          {conversation.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>

                      {/* Info & Last message snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-xs font-bold text-gray-900 truncate">
                            {conversation.fullName}
                          </h3>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {lastMsgDate}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {lastMsgPreview}
                        </p>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shrink-0 self-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Messages Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50/50">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      {conversations.find(c => c.userId === selectedConversation)?.fullName}
                    </h2>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">
                      {conversations.find(c => c.userId === selectedConversation)?.role}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold outline-none"
                    >
                      <option value="all">All Messages</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 italic">
                      No messages in this conversation thread yet.
                    </div>
                  ) : (
                    filteredMessages.map((message) => {
                      const isMe = message.senderId === user?.userId
                      return (
                        <div
                          key={message.messageId}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                            isMe
                              ? 'bg-blue-500 text-white rounded-tr-none'
                              : 'bg-white text-gray-900 border border-gray-150 rounded-tl-none'
                          }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <span className={`text-[9px] font-black ${isMe ? 'text-white/80' : 'text-gray-500'} uppercase tracking-wider`}>
                                {isMe ? 'You' : message.senderName}
                              </span>
                              <span className={`text-[8px] ${isMe ? 'text-white/60' : 'text-slate-450'}`}>
                                {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4 bg-white shrink-0">
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-4 py-3 text-xs font-semibold text-gray-900 outline-none placeholder-gray-450"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-blue-500/25 mx-auto mb-4" />
                  <h3 className="text-md font-bold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm px-6">
                    Choose a conversation from the list or start a new thread to message your student's guardians.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-150 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50/50 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-blue-500" />
                Select Recipient
              </h3>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student's name..."
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {students.filter(student => 
                  student.fullName.toLowerCase().includes(searchStudentTerm.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-550 italic">
                    No matching students found.
                  </div>
                ) : (
                  students.filter(student => 
                    student.fullName.toLowerCase().includes(searchStudentTerm.toLowerCase())
                  ).map((student) => (
                    <div 
                      key={student.studentId}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-150 rounded-2xl hover:border-blue-500/25 transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-gray-955 text-xs">{student.fullName}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Guardian: <span className="font-semibold text-gray-700">{student.guardianName}</span>
                        </p>
                      </div>
                      
                      {student.guardianId ? (
                        <button
                          onClick={() => {
                            const recipientId = student.guardianId
                            const existingConv = conversations.find(c => c.userId === recipientId)
                            if (!existingConv) {
                              setConversations(prev => [
                                {
                                  userId: recipientId,
                                  fullName: student.guardianName,
                                  role: 'guardian',
                                  unreadCount: 0,
                                  lastMessage: { content: 'Start conversation...', sentAt: new Date().toISOString() }
                                },
                                ...prev
                              ])
                            }
                            setSelectedConversation(recipientId)
                            setShowNewChatModal(false)
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Message
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg">
                          No Guardian
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
