

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link, useLocation } from 'react-router-dom';
import rocketLogo from '../assets/rocket-svgrepo-com.svg';

import '../Colors.css';  


// header
export default function Header() {
  const location = useLocation();

  // check if current page is the reservations page by comparing URL path
  const isReservations = location.pathname === '/reservations';

  // all of the CSS/Design stuff
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ 
        backgroundColor: 'var(--prussian-blue)',
        zIndex: 9999,
        '& .MuiToolbar-root': {
          minHeight: {
            xs: '48px',
            sm: '64px'
          },
          padding: {
            xs: '0 10px',
            sm: '0 24px'
          }
        }
      }}>
        <Toolbar>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img 
              src={rocketLogo} 
              alt="Rocket Logo" 
              style={{
                height: '30px',
                marginRight: '10px',
                filter: 'brightness(0) invert(1)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontSize: {
                  xs: '1rem',
                  sm: '1.25rem'
                },
                color: 'var(--celestial-blue)',
                '&:hover': {
                  color: 'white'
                }
              }}
            >
              COSMOS ODYSSEY
            </Typography>
          </Link>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            component={Link}
            to="/"
            variant="contained"
            color="inherit" 
            sx={{ 
              height: {
                xs: '35px',
                sm: '40px'
              },
              minWidth: {
                xs: '60px',
                sm: '100px'
              },
              backgroundColor: !isReservations ? 'var(--indigo-dye)' : 'var(--prussian-blue)',
              boxShadow: 'none',
              border: '1px solid var(--prussian-blue)',
              borderRadius: '4px 0 0 4px',
              borderRight: 'none',
              fontSize: {
                xs: '0.8rem',
                sm: '0.875rem'
              },
              '&:hover': {
                backgroundColor: 'var(--indigo-dye)',
                border: '1px solid var(--celestial-blue)',
                borderRight: 'none'
              }
            }}
          >
            HOME
          </Button>
          <Button 
            component={Link}
            to="/reservations"
            variant="contained"
            color="inherit" 
            sx={{ 
              height: {
                xs: '35px',
                sm: '40px'
              },
              minWidth: {
                xs: '60px',
                sm: '100px'
              },
              backgroundColor: isReservations ? 'var(--indigo-dye)' : 'var(--prussian-blue)',
              boxShadow: 'none',
              border: '1px solid var(--prussian-blue)',
              borderRadius: '0 4px 4px 0',
              fontSize: {
                xs: '0.8rem',
                sm: '0.875rem'
              },
              '&:hover': {
                backgroundColor: 'var(--indigo-dye)',
                border: '1px solid var(--celestial-blue)'
              }
            }}
          >
            RESERVATIONS
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}