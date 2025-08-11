import React, { useState } from 'react';
import { FaTrophy, FaGamepad, FaClipboardList, FaUserShield } from 'react-icons/fa';

type Tab = 'leaderboard' | 'game' | 'log' | 'officer';

// Fix 1: Use JSX.Element instead of React.ReactNode for icon type
const tabConfig: { key: Tab; label: string; icon: React.ReactElement }[] = [
    { key: 'leaderboard', label: 'Leaderboard', icon: <FaTrophy /> },
    { key: 'game', label: 'Game', icon: <FaGamepad /> },
    { key: 'officer', label: 'Officer', icon: <FaUserShield /> },
    { key: 'log', label: 'Log', icon: <FaClipboardList /> },
];

interface BottomNavBarProps {
    onTabChange?: (tab: Tab) => void;
    initialTab?: Tab;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onTabChange, initialTab = 'leaderboard' }) => {
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                background: '#fff',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 100,
            }}
        >
            {tabConfig.map(({ key, label, icon }) => (
                <button
                    key={key}
                    onClick={() => handleTabClick(key)}
                    style={{
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: activeTab === key ? '#1976d2' : '#757575',
                        fontWeight: activeTab === key ? 'bold' : 'normal',
                        fontSize: 14,
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span>{label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNavBar;