// IMPORTTS

import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Slide from '@mui/material/Slide';
import Fade from '@mui/material/Fade';
import Popover from '@mui/material/Popover';
import { useState, useEffect } from 'react';
import rocketLogo from '../assets/rocket-svgrepo-com.svg';
import Results from './Results';
import { addPricelist } from '../utils/db';

import '../Colors.css';  

export default function SearchBar() {
    // state for controlling animations (if they fly etc.)
    const [checked, setChecked] = useState(false);
    
    // state for tracking if search was successful 
    const [searchSuccess, setSearchSuccess] = useState(false);
    
    // storing selected origin and destination planets
    const [fromPlanet, setFromPlanet] = useState('');
    const [toPlanet, setToPlanet] = useState('');
    
    // storing list of available planets
    const [planets, setPlanets] = useState([]);
    
    // tracking loading status
    const [loading, setLoading] = useState(true);
    
    // popover states
    const [fromAnchorEl, setFromAnchorEl] = useState(null);
    const [toAnchorEl, setToAnchorEl] = useState(null);

    // add state for search results
    const [searchResults, setSearchResults] = useState(null);

    // handle search validation (if they do be filled)
    // async function allows the use of await within it, pauses the execution until the promise is resolved
    const handleSearch = async function(event) {
        const fromInput = document.querySelector('#from-autocomplete');
        const toInput = document.querySelector('#to-autocomplete');
        
        if (!fromPlanet) {
            setFromAnchorEl(fromInput);
            return;
        }
        if (!toPlanet) {
            setToAnchorEl(toInput);
            return;
        }
        // try catch if search works
        try {
            const response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // store the pricelist
            addPricelist(data);
            
            // pass all legs along with the selected planets
            // legs = routes
            setSearchResults({ 
                ...data, 
                selectedRoute: {
                    from: fromPlanet,
                    to: toPlanet
                }
            });
            setSearchSuccess(true);
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    };

    // close popovers
    const handleClosePopovers = () => {
        setFromAnchorEl(null);
        setToAnchorEl(null);
    };

    useEffect(() => {
        // slight delay to ensure DOM is ready (I had issues with the first slide version)
        setTimeout(() => {
            setChecked(true);
        }, 100);
        fetchPlanets();
    }, []);

    // does the switcheroo for the from/to
    const handleSwitch = () => {
        const tempFrom = fromPlanet;
        setFromPlanet(toPlanet);
        setToPlanet(tempFrom);
    };

    // gets planets from the API
    // maybe with a useEffect?
    const fetchPlanets = async () => {
        try {
            const response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // store the pricelist
            addPricelist(data);
            
            // extract unique planet names from legs
            const uniquePlanets = new Set();
            data.legs.forEach(leg => {
                uniquePlanets.add(leg.routeInfo.from.name);
                uniquePlanets.add(leg.routeInfo.to.name);
            });
            
            setPlanets(Array.from(uniquePlanets).sort());
            setLoading(false);
            console.log('Yo It Works!!', data);
        } catch (error) {
            console.error('Error fetching planets:', error);
            setLoading(false);
        }
    };

    // function fetch the API data
    // the actual API link is:
    // https://cosmosodyssey.azurewebsites.net/api/v1.0/TravelPrices

    const BASE_URL = '/api/api/v1.0/TravelPrices';  // use proxy

    // Style design stuff
    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100vh',
            margin: 0,
            padding: '20px',
            boxSizing: 'border-box',
            position: 'relative',
            width: '100%',
            gap: '20px'
        }}>
            <div style={{
                transform: searchSuccess ? 'translateY(-49vh)' : 'translateY(0)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%',
                marginTop: '40vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}>
                <Slide 
                    direction="up" 
                    in={checked} 
                    timeout={600}
                >
                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        position: 'relative'
                    }}>
                        <Fade in={!searchSuccess} timeout={600}>
                            <div style={{
                                position: 'relative',
                                marginBottom: '30px'
                            }}>
                                <img 
                                    src={rocketLogo} 
                                    alt="Rocket Logo" 
                                    style={{
                                        height: '100px',
                                        filter: 'brightness(0) invert(1)'
                                    }}
                                />
                            </div>
                        </Fade>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '30px',
                            width: '100%',
                            maxWidth: '800px',
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            {/* The FROM bar */}
                            <Autocomplete
                                id="from-autocomplete"
                                disablePortal
                                options={planets.filter(planet => planet !== toPlanet)}
                                value={fromPlanet}
                                onChange={(event, newValue) => {
                                    setFromPlanet(newValue);
                                }}
                                disabled={loading}
                                sx={{ 
                                    flex: 1,
                                    minWidth: {
                                        xs: '100px',
                                        sm: '200px'
                                    },
                                    maxWidth: {
                                        xs: '140px',
                                        sm: '300px'
                                    },
                                    backgroundColor: 'var(--prussian-blue)',
                                    '&:hover': {
                                        backgroundColor: 'var(--indigo-dye)',
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: 'var(--celestial-blue)',
                                                borderRight: 'none'
                                            }
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'var(--celestial-blue)',
                                        fontSize: {
                                            xs: '0.8rem',
                                            sm: '1rem'
                                        }
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        height: {
                                            xs: '45px',
                                            sm: '56px'
                                        },
                                        '& fieldset': {
                                            borderColor: 'var(--prussian-blue)',
                                            borderRadius: '4px 0 0 4px',
                                            borderRight: 'none'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                            borderRight: 'none'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                            borderRight: 'none'
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'var(--celestial-blue)',
                                        fontSize: {
                                            xs: '0.8rem',
                                            sm: '1rem'
                                        },
                                        padding: {
                                            xs: '5px',
                                            sm: '16.5px 14px'
                                        }
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'var(--celestial-blue)',
                                        fontSize: {
                                            xs: '1.2rem',
                                            sm: '1.5rem'
                                        }
                                    },
                                    '& .MuiAutocomplete-endAdornment': {
                                        right: {
                                            xs: '5px',
                                            sm: '9px'
                                        }
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={loading ? "Loading..." : "From"}
                                    />
                                )}
                            />

                            {/* The Switcheroo button */}
                            <Button 
                                variant="contained"
                                onClick={handleSwitch}
                                sx={{
                                    minWidth: {
                                        xs: '32px',
                                        sm: '45px'
                                    },
                                    height: {
                                        xs: '45px',
                                        sm: '56px'
                                    },
                                    backgroundColor: 'var(--prussian-blue)',
                                    outline: 'none',
                                    border: '1px solid var(--prussian-blue)',
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    boxShadow: 'none',
                                    borderRadius: 0,
                                    margin: '0 -1px',
                                    zIndex: 1,
                                    fontSize: {
                                        xs: '1rem',
                                        sm: '1.4rem'
                                    },
                                    padding: 0,
                                    '&:hover': {
                                        backgroundColor: 'var(--indigo-dye)',
                                        borderTop: '1px solid var(--celestial-blue)',
                                        borderBottom: '1px solid var(--celestial-blue)',
                                        borderLeft: 'none',
                                        borderRight: 'none'
                                    }
                                }}
                            >
                                ⇄
                            </Button>

                            {/* The TO bar */}
                            <Autocomplete
                                id="to-autocomplete"
                                disablePortal
                                options={planets.filter(planet => planet !== fromPlanet)}
                                value={toPlanet}
                                onChange={(event, newValue) => {
                                    setToPlanet(newValue);
                                }}
                                disabled={loading}
                                sx={{ 
                                    flex: 1,
                                    minWidth: {
                                        xs: '100px',
                                        sm: '200px'
                                    },
                                    maxWidth: {
                                        xs: '140px',
                                        sm: '300px'
                                    },
                                    backgroundColor: 'var(--prussian-blue)',
                                    '&:hover': {
                                        backgroundColor: 'var(--indigo-dye)'
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'var(--celestial-blue)',
                                        fontSize: {
                                            xs: '0.8rem',
                                            sm: '1rem'
                                        }
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        height: {
                                            xs: '45px',
                                            sm: '56px'
                                        },
                                        '& fieldset': {
                                            borderColor: 'var(--prussian-blue)',
                                            borderRadius: 0,
                                            borderLeft: 'none',
                                            borderRight: 'none'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'var(--celestial-blue)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'var(--celestial-blue)'
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'var(--celestial-blue)',
                                        fontSize: {
                                            xs: '0.8rem',
                                            sm: '1rem'
                                        },
                                        padding: {
                                            xs: '5px',
                                            sm: '16.5px 14px'
                                        }
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: 'var(--celestial-blue)',
                                        fontSize: {
                                            xs: '1.2rem',
                                            sm: '1.5rem'
                                        }
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={loading ? "Loading..." : "To"}
                                    />
                                )}
                            />

                            {/* The SEARCH BUTTON */}
                            <Button 
                                variant="contained"
                                onClick={handleSearch}
                                sx={{
                                    minWidth: {
                                        xs: '50px',
                                        sm: '80px'
                                    },
                                    height: {
                                        xs: '45px',
                                        sm: '56px'
                                    },
                                    backgroundColor: 'var(--prussian-blue)',
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: 'none',
                                    borderTop: '1px solid var(--prussian-blue)',
                                    borderRight: '1px solid var(--prussian-blue)',
                                    borderBottom: '1px solid var(--prussian-blue)',
                                    borderLeft: 'none',
                                    fontSize: {
                                        xs: '0.8rem',
                                        sm: '1rem'
                                    },
                                    padding: {
                                        xs: '0 10px',
                                        sm: '0 20px'
                                    },
                                    '&:hover': {
                                        backgroundColor: 'var(--indigo-dye)',
                                        borderTop: '1px solid var(--celestial-blue)',
                                        borderRight: '1px solid var(--celestial-blue)',
                                        borderBottom: '1px solid var(--celestial-blue)',
                                        borderLeft: 'none'
                                    }
                                }}
                            >
                                Search
                            </Button>

                            {/* Show if empty */}
                            {/* From Popover */}
                            <Popover
                                open={Boolean(fromAnchorEl)}
                                anchorEl={fromAnchorEl}
                                onClose={handleClosePopovers}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'center',
                                }}
                                transformOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                }}
                                sx={{
                                    '& .MuiPopover-paper': {
                                        backgroundColor: 'var(--prussian-blue)',
                                        color: 'red',
                                        padding: '10px',
                                        border: '1px solid var(--celestial-blue)',
                                    }
                                }}
                            >
                                Please select a departure planet
                            </Popover>

                            {/* To Popover */}
                            <Popover
                                open={Boolean(toAnchorEl)}
                                anchorEl={toAnchorEl}
                                onClose={handleClosePopovers}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'center',
                                }}
                                transformOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                }}
                                sx={{
                                    '& .MuiPopover-paper': {
                                        backgroundColor: 'var(--prussian-blue)',
                                        color: 'red',
                                        padding: '10px',
                                        border: '1px solid var(--celestial-blue)',
                                        marginBottom: '10px',
                                    }
                                }}
                            >
                                Please select a destination planet
                            </Popover>
                        </div>
                    </div>
                </Slide>
                <Results searchResults={searchResults} searchSuccess={searchSuccess} />
            </div>
        </div>
    );
}