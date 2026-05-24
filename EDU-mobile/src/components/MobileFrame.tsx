import React, { useEffect, useState } from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [time, setTime] = useState('09:41');
  const [battery, setBattery] = useState(100);

  // Update time dynamic like a real phone status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hours = d.getHours().toString();
      let minutes = d.getMinutes().toString();
      if (hours.length < 2) hours = '0' + hours;
      if (minutes.length < 2) minutes = '0' + minutes;
      setTime(`${hours}:${minutes}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Simulate slowly discharging battery
  useEffect(() => {
    const interval = setInterval(() => {
      setBattery(prev => {
        if (prev <= 10) return 100; // recharge
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="web-layout">
      <div className="simulator-header">
        <h1>EDU MOBILE PORTAL</h1>
        <p>Интерактивная панель успеваемости на React / Vite</p>
      </div>

      <div className="phone-shell animate-slide-up">
        {/* Notch */}
        <div className="phone-notch">
          <div className="camera-lens"></div>
        </div>

        <div className="phone-screen">
          {/* Status Bar */}
          <div className="phone-status-bar">
            <span className="status-time">{time}</span>
            <div className="status-icons">
              {/* Cellular Signal Icon */}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
                <rect x="0" y="8" width="2" height="2" rx="0.5" />
                <rect x="3" y="6" width="2" height="4" rx="0.5" />
                <rect x="6" y="4" width="2" height="6" rx="0.5" />
                <rect x="9" y="2" width="2" height="8" rx="0.5" />
                <rect x="12" y="0" width="2" height="10" rx="0.5" />
              </svg>
              {/* Wifi Icon */}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
                <path d="M7 9a1 1 0 100-2 1 1 0 000 2zM1.8 4.2a7.3 7.3 0 0110.4 0 1 1 0 101.4-1.4 9.3 9.3 0 00-13.2 0 1 1 0 101.4 1.4zm2.1 2.1a4.3 4.3 0 016.2 0 1 1 0 001.4-1.4 6.3 6.3 0 00-9 0 1 1 0 101.4 1.4z" />
              </svg>
              {/* Battery Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '0.65rem', marginRight: '2px' }}>{battery}%</span>
                <div style={{
                  width: '20px',
                  height: '10px',
                  border: '1.5px solid currentColor',
                  borderRadius: '3px',
                  padding: '1px',
                  position: 'relative',
                  display: 'flex'
                }}>
                  <div style={{
                    width: `${Math.max(2, (battery / 100) * 14)}px`,
                    height: '100%',
                    background: battery < 20 ? '#ff5252' : '#00e676',
                    borderRadius: '1px'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    right: '-3px',
                    top: '2px',
                    width: '2px',
                    height: '4px',
                    background: 'currentColor',
                    borderTopRightRadius: '1px',
                    borderBottomRightRadius: '1px'
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Screen main context */}
          {children}

          {/* Home Pill Indicator */}
          <div className="phone-home-indicator"></div>
        </div>
      </div>
    </div>
  );
};
