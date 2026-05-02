import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Settings as SettingsIcon, Bell, Shield, User, Zap, ChevronLeft, Trash2, AlertTriangle, Radiation, Power } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const resetAllData = useStore((state) => state.resetAllData);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const sections = [
    { icon: User, label: 'Account', desc: 'Manage your profile and data' },
    { icon: Bell, label: 'Notifications', desc: 'Configure system alerts' },
    { icon: Shield, label: 'Privacy', desc: 'Secure your digital presence' },
    { icon: Zap, label: 'Appearance', desc: 'Customize visual interface' },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-4xl mx-auto space-y-12 overflow-y-auto no-scrollbar">
      <header className="flex items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')} 
            className="rounded-full bg-white/5 h-12 w-12 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 hidden md:block">Return</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter neon-text italic uppercase">Settings</h1>
          <p className="text-muted-foreground font-bold tracking-[0.2em] text-[10px] mt-2 flex items-center gap-3">
            <span className="w-12 h-[1px] bg-primary/30" />
            PERSONALIZING YOUR EXPERIENCE
          </p>
        </motion.div>
      </header>

      <div className="grid gap-6">
        {sections.map((section, i) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-none hover:bg-white/10 transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between p-8">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:neon-glow transition-all duration-500">
                    <section.icon className="w-6 h-6 text-primary group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black italic tracking-tight uppercase group-hover:text-primary transition-colors">
                      {section.label}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium tracking-wide mt-1">
                      {section.desc}
                    </p>
                  </div>
                </div>

                {section.label === 'Account' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowResetConfirm(true)}
                    className="rounded-full bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold uppercase text-[10px] tracking-widest px-6 border border-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Reset Data
                  </Button>
                )}
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Elegant Reset Confirmation Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md bg-zinc-950/95 border border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl backdrop-blur-2xl">
          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="w-6 h-6 text-red-500/80" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight uppercase text-white">Reset Account</h2>
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Action Confirmation</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center leading-relaxed">
              This will permanently delete your entire progress, goals, and history. 
              Your interface will be reset to its initial state.
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={resetAllData}
                className="h-14 rounded-2xl border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[11px]"
              >
                Permanently Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowResetConfirm(false)}
                className="h-12 rounded-2xl text-muted-foreground hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
              >
                Go Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-8 rounded-[3rem] bg-white/5 border border-white/5 flex flex-col items-center text-center space-y-4 opacity-50">
        <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Aurora</div>
        <div className="text-xs font-medium text-muted-foreground/60 max-w-xs">
          Refining your focus. Version 2.4.0
        </div>
      </div>
    </div>
  );
};
