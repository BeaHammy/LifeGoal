import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { geminiService } from '../services/geminiService';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Send, Bot, User, Sparkles, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const ChatDock: React.FC = () => {
  const isOpen = useStore((state) => state.isChatOpen);
  const setIsOpen = useStore((state) => state.setChatOpen);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Yo. Jestem Twoim asystentem Aurora. Co dziś rozwijamy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const dimensions = useStore((state) => state.dimensions);
  const goals = useStore((state) => state.goals);
  const completedTasks = useStore((state) => state.completedTasks);
  const reloadCount = useStore((state) => state.reloadCount);
  const lastReloadDate = useStore((state) => state.lastReloadDate);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const currentState = { dimensions, goals, completedTasks, reloadCount, lastReloadDate };
      const response = await geminiService.chat(input, currentState as any);
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[108px] right-8 z-[90] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9, rotateY: 15, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.9, rotateY: 15 }}
            whileHover={{ rotateX: -2, rotateY: 5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="mb-4 w-[calc(100vw-4rem)] md:w-[400px] h-[600px] max-h-[70vh] flex flex-col perspective-1000"
          >
            <Card className="flex-1 glass-card border-none flex flex-col overflow-hidden rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/50 blur-[4px] animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-100">Neural Link Interface</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
                  <div className="space-y-6 pb-4">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-all ${
                            msg.role === 'user' ? 'bg-white/[0.03] border border-white/10' : 'bg-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-black" />}
                          </div>
                          <div className={`p-4 rounded-2xl text-[13px] leading-relaxed relative ${
                            msg.role === 'user' 
                              ? 'bg-primary/10 text-white rounded-tr-none border border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                              : 'bg-white/[0.03] text-zinc-300 rounded-tl-none border border-white/10'
                          }`}>
                            <div className="flex items-center gap-2 mb-1.5 opacity-50">
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                {msg.role === 'user' ? 'Link Node 01' : 'Aurora Core'}
                              </span>
                            </div>
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex gap-3 items-center text-primary text-[10px] font-black uppercase tracking-[0.2em] bg-primary/5 px-5 py-3 rounded-2xl border border-primary/10 animate-pulse">
                          <div className="relative">
                            <Sparkles className="w-3 h-3" />
                            <div className="absolute inset-0 bg-primary/50 blur-[4px] animate-ping" />
                          </div>
                          Neural Processing...
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-6 bg-black/60 backdrop-blur-2xl border-t border-white/5">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3"
                  >
                    <div className="relative flex-1 group">
                      <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="COMMAND INTAKE..."
                        className="bg-white/5 border-white/5 h-12 text-[13px] rounded-2xl px-5 focus:border-primary/50 transition-all placeholder:text-zinc-600 font-medium"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={isLoading} 
                      className="rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] h-12 w-12 bg-primary hover:bg-primary/80 shrink-0 transition-transform active:scale-95"
                    >
                      <Send className="w-5 h-5 text-black" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
