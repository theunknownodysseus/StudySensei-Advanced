import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Loader, Trash2, BookOpen, Brain, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  topic?: string;
};

const ChatBot: React.FC = () => {
  const { isChatOpen, closeChat } = useChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatConversations');
    if (savedConversations) {
      const parsedConversations = JSON.parse(savedConversations).map((conv: any) => ({
        ...conv,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setConversations(parsedConversations);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);

  // Create new conversation when chat is opened
  useEffect(() => {
    if (isChatOpen && !currentConversation) {
      createNewConversation();
    }
  }, [isChatOpen]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Question',
      messages: [{
        text: "Hi! I'm your learning assistant. I can help you with:\n\n• Explaining concepts\n• Solving problems\n• Answering doubts\n• Providing examples\n• Suggesting learning resources\n\nWhat would you like to learn about?",
        isUser: false,
        timestamp: new Date()
      }],
      lastUpdated: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
  };

  const switchConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowHistory(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickPrompts(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    // Update current conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      lastUpdated: new Date()
    };
    setCurrentConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    );
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get the last 5 messages for context
      const recentMessages = updatedConversation.messages.slice(-5);
      const context = recentMessages.map(msg => 
        `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');

      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 2mC1YziBQPIBAFbHcF7oA978rmejqCbBe6alX233'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `You are a helpful learning assistant focused on explaining concepts and answering questions. Your role is to:
1. Provide clear, concise explanations
2. Use examples when helpful
3. Break down complex topics
4. Answer specific questions
5. Suggest learning resources when relevant

Here's the recent conversation context:\n\n${context}\n\nUser: ${inputMessage}\n\nProvide a helpful, educational response that maintains context:`,
          max_tokens: 300,
          temperature: 0.7,
        })
      });

      const data = await response.json();
      const botResponse = data.generations[0].text.trim();

      // Update conversation with bot response
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, {
          text: botResponse,
          isUser: false,
          timestamp: new Date()
        }],
        lastUpdated: new Date(),
        title: updatedConversation.messages.length === 1 ? inputMessage.slice(0, 30) + '...' : updatedConversation.title
      };
      setCurrentConversation(finalConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id ? finalConversation : conv
        )
      );
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, {
          text: "I'm sorry, I'm having trouble responding right now. Please try again.",
          isUser: false,
          timestamp: new Date()
        }],
        lastUpdated: new Date()
      };
      setCurrentConversation(errorConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id ? errorConversation : conv
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Can you explain this concept?",
    "I'm stuck on this problem",
    "Can you give me an example?",
    "What's the difference between these?",
    "How do I solve this?",
    "Can you break this down?",
    "What are some resources to learn this?",
    "Why does this work this way?"
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => isChatOpen ? closeChat() : createNewConversation()}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle size={20} />
                </button>
                <h3 className="text-lg font-semibold text-white">
                  {showHistory ? 'Question History' : currentConversation?.title || 'New Question'}
                </h3>
              </div>
              <button
                onClick={closeChat}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {showHistory ? (
                // Conversation History
                <div className="h-full overflow-y-auto p-4">
                  <button
                    onClick={createNewConversation}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg mb-4 hover:bg-blue-700 transition-colors"
                  >
                    New Question
                  </button>
                  <div className="space-y-2">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <button
                          onClick={() => switchConversation(conv)}
                          className="flex-1 text-left truncate"
                        >
                          {conv.title}
                        </button>
                        <button
                          onClick={() => deleteConversation(conv.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Current Conversation
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation?.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                          <span className="text-xs opacity-50 mt-1 block">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                          <Loader className="animate-spin" size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                  {showQuickPrompts && currentConversation?.messages.length === 1 && (
                    <div className="p-4 bg-gray-800 border-t border-gray-700">
                      <h4 className="text-sm text-gray-400 mb-2">Quick Questions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {quickPrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(prompt)}
                            className="text-sm text-gray-300 bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors text-left"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-gray-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask your question..."
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot; 