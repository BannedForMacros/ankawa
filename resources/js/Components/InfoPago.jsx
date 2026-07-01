import React, { useState } from 'react';
import { CreditCard, ExternalLink, ChevronDown, Copy, CheckCircle2 } from 'lucide-react';

export default function InfoPago() {
    const [isOpen, setIsOpen] = useState(false);
    const [copiedItem, setCopiedItem] = useState(null);

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopiedItem(type);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    return (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-300">
            {/* Header (Desplegable) */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 sm:px-6 transition-colors duration-200 ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-[#BE0F4A] text-white' : 'bg-[#BE0F4A]/10 text-[#BE0F4A]'}`}>
                        <CreditCard size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm sm:text-base font-black text-[#291136] tracking-tight">Opciones de Pago</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Transferencia Interbank o Pago en Línea (Tarjeta)</p>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
            </button>

            {/* Contenido Desplegable */}
            <div 
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
            >
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Opción 1: Depósito / Transferencia */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
                            <div className="h-[80px] px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#BE0F4A]">Opción 1: Transferencia</span>
                                <div className="h-12 bg-white rounded-lg flex items-center justify-center px-4 border border-gray-200 shadow-sm">
                                    <img src="/images/interbank.webp" alt="Interbank" className="h-7 sm:h-8 w-auto object-contain scale-110" />
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Titular de la Cuenta</p>
                                    <p className="text-sm font-black text-[#291136]">The Ankawa Global Group SAC</p>
                                </div>
                                <div className="space-y-3">
                                    {/* Cuenta Corriente */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-[#BE0F4A]/30 transition-colors group">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Cuenta Corriente (Soles)</p>
                                            <p className="text-sm font-black text-[#291136] tracking-wider font-mono">420-3001901183</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleCopy('420-3001901183', 'cta')}
                                            className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#BE0F4A] hover:border-[#BE0F4A] transition-all shadow-sm"
                                            title="Copiar Cuenta"
                                        >
                                            {copiedItem === 'cta' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    
                                    {/* CCI */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-[#BE0F4A]/30 transition-colors group">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Código Interbancario (CCI)</p>
                                            <p className="text-sm font-black text-[#291136] tracking-wider font-mono">011-420-00300190118379</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleCopy('01142000300190118379', 'cci')}
                                            className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#BE0F4A] hover:border-[#BE0F4A] transition-all shadow-sm"
                                            title="Copiar CCI"
                                        >
                                            {copiedItem === 'cci' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Opción 2: Pago en Línea */}
                        <div className="bg-[#fcfafc] rounded-xl border border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden relative flex flex-col">
                            {/* Decoración de fondo suave */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BE0F4A] opacity-[0.03] rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#291136] opacity-[0.03] rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                            <div className="h-[80px] px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 relative z-10">
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#BE0F4A]">Opción 2: Tarjeta</span>
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center relative z-10">
                                <div className="w-12 h-12 rounded-full bg-[#291136]/5 border border-[#291136]/10 flex items-center justify-center mb-4">
                                    <CreditCard size={24} className="text-[#291136]" />
                                </div>
                                <h4 className="text-[#291136] font-black text-lg tracking-tight mb-2">Pago Rápido y Seguro</h4>
                                <p className="text-gray-500 text-xs font-medium leading-relaxed mb-6 max-w-[200px]">
                                    Aceptamos todas las tarjetas de crédito y débito a través de nuestra pasarela de pagos.
                                </p>
                                
                                <a 
                                    href="https://card.ankawagroup.org/pago-de-servicios/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#BE0F4A] hover:bg-[#9c0a3b] text-white text-sm font-bold transition-all shadow-lg shadow-[#BE0F4A]/20 group"
                                >
                                    Pagar en Línea
                                    <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
