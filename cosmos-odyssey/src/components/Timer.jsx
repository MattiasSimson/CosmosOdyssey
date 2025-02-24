import React from 'react';
import { useState, useEffect } from 'react';
import Chip from '@mui/material/Chip';

const Timer = ({ expiryDate, status }) => {
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    const getTime = () => {
        if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
            setIsExpired(true);
            return;
        }

        const time = new Date(expiryDate) - Date.now();
        
        if (time <= 0) {
            setIsExpired(true);
            return;
        }

        setDays(Math.floor(time / (1000 * 60 * 60 * 24)));
        setHours(Math.floor((time / (1000 * 60 * 60)) % 24));
        setMinutes(Math.floor((time / 1000 / 60) % 60));
        setSeconds(Math.floor((time / 1000) % 60));
    };

    useEffect(() => {
        getTime();
        const interval = setInterval(getTime, 1000);
        return () => clearInterval(interval);
    }, [expiryDate]);

    const timeString = isExpired ? 'Expired' : 
        expiryDate && !isNaN(new Date(expiryDate).getTime()) ?
        `Valid until ${new Date(expiryDate).toLocaleString()} (${days}d ${hours}h ${minutes}m ${seconds}s)` :
        'Invalid Date'; // just a simple check

    return (
        <Chip 
            label={timeString}
            sx={{
                backgroundColor: status === 'active' ? 'rgba(46, 204, 113, 0.2)' : 
                                status === 'warning' ? 'rgba(255, 183, 77, 0.2)' : 
                                'rgba(255, 107, 107, 0.2)',
                color: status === 'active' ? '#2ecc71' :  
                        status === 'warning' ? '#ffb74d' : 
                        '#ff6b6b',
                borderRadius: '4px',
                fontSize: '0.8rem',
                maxWidth: '100%',
                whiteSpace: 'normal',
                height: 'auto',
                '& .MuiChip-label': {
                    whiteSpace: 'normal',
                    display: 'block',
                    padding: '8px'
                }
            }}
        />
    );
};

export default Timer; 