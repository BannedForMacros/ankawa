import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedTabs({ tabs, activeTab, onChange }) {
    return (
        <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            relative py-4 px-1 font-medium text-sm transition-colors duration-200
                            ${activeTab === tab.id
                                ? 'text-[#BE0F4A]'
                                : 'text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        {tab.name}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BE0F4A]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
}