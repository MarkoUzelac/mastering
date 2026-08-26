sed -i '/<ProcessingChain/,/\/>/!b;//!d;/\/>/a\
                {/* Massive Export Master Button */}\
                <button\
                  onClick={() => {\
                    soundHaptics.playMasterStart();\
                    handleTriggerMaster();\
                  }}\
                  disabled={isMasteringInProgress}\
                  className={`w-full flex items-center justify-between px-6 py-4 min-h-[64px] transition cursor-pointer active:scale-[0.99] select-none ${\
                    isMasteringInProgress\
                      ? '"'"'bg-[var(--text-tertiary)] cursor-wait'"'"'\
                      : '"'"'bg-[var(--accent-lime)] hover:bg-[#c9ff2e]'"'"'\
                  }`}\
                >\
                  <div className="flex items-center gap-4">\
                    <div className="w-10 h-10 border border-black/20 flex items-center justify-center">\
                      {masterStage === '"'"'MASTER READY'"'"' ? (\
                        <Download className="w-5 h-5 text-black" />\
                      ) : isMasteringInProgress ? (\
                        <Sparkles className="w-5 h-5 animate-spin text-black" style={{ animationDuration: '"'"'2s'"'"' }} />\
                      ) : (\
                        <Upload className="w-5 h-5 text-black" />\
                      )}\
                    </div>\
                    <span className="tracking-widest uppercase font-mono font-bold text-black text-xl">\
                      {masterStage === '"'"'MASTER READY'"'"' ? '"'"'EXPORT MASTER'"'"' : isMasteringInProgress ? '"'"'MASTERING...'"'"' : '"'"'RENDER MASTER'"'"'}\
                    </span>\
                  </div>\
                  <div className="flex items-center gap-3">\
                    <span className="text-[10px] font-mono text-black font-bold tracking-widest px-2 py-1 border border-black/20">\
                      24-BIT WAV\
                    </span>\
                    <ChevronDown className="w-5 h-5 text-black opacity-50" />\
                  </div>\
                </button>\
' src/App.tsx
