import * as React from 'react';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import '../Colors.css';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from '@mui/material/Chip';

import { addReservation } from '../utils/db';
import {
    calculateRouteDetails,
    validateConnectingFlights,
    isRouteComplete,
    findBestProviderCombination,
    findRouteGap,
    findAllRoutes
} from '../utils/routeUtils';

// catch and handle rendering errors for individual routes
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    // shows stuff
    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{
                    backgroundColor: 'var(--prussian-blue)',
                    color: 'var(--celestial-blue)',
                    padding: '16px',
                    borderRadius: '4px',
                    border: '1px solid var(--celestial-blue)',
                    textAlign: 'center'
                }}>
                    <Typography sx={{ mb: 2 }}>⚠️ Something went wrong with this route.</Typography>
                    <Button
                        onClick={() => this.setState({ hasError: false })}
                        sx={{
                            color: 'var(--celestial-blue)',
                            borderColor: 'var(--celestial-blue)',
                            '&:hover': {
                                backgroundColor: 'var(--indigo-dye)',
                                borderColor: 'var(--celestial-blue)'
                            }
                        }}
                        variant="outlined"
                    >
                        Try Again
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

// component for displaying and managing individual route options
function RouteOption({ route, filter, selectedCompanies }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [selectedProviders, setSelectedProviders] = React.useState(() => {
        try {
            return findBestProviderCombination(route, filter, selectedCompanies);
        } catch (error) {
            console.error('Error initializing providers:', error);
            return [];
        }
    });

    // update selected providers when filter or route changes
    React.useEffect(() => {
        try {
            const bestProviders = findBestProviderCombination(route, filter, selectedCompanies);
            setSelectedProviders(bestProviders);
            const validation = validateConnectingFlights(bestProviders, false);
            setValidationError(validation.valid ? null : validation.error);
        } catch (error) {
            console.error('Error updating providers:', error);
            setValidationError('Error finding best route combination');
        }
    }, [filter, route, selectedCompanies]);

    const [validationError, setValidationError] = React.useState(null);
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [nameError, setNameError] = React.useState(null);
    const [removalConfirmation, setRemovalConfirmation] = React.useState(null);

    const details = calculateRouteDetails(route, selectedProviders);

    // Handle segment removal confirmation
    const handleRemoveSegment = (index, segment, newProviders) => {
        const previewProviders = newProviders.map((p, i) => i === index ? null : p);
        const routeGap = findRouteGap(route, previewProviders);
        const validation = validateConnectingFlights(previewProviders, true);
        
        setRemovalConfirmation({
            index,
            segment,
            providers: newProviders,
            routeGap,
            validation
        });
    };

    // handle removal confirmation dialog
    const handleRemovalConfirmationClose = (confirmed) => {
        if (confirmed && removalConfirmation) {
            const { index, providers } = removalConfirmation;
            const newProviders = [...providers];
            newProviders[index] = null;
            setSelectedProviders(newProviders);
            
            const validation = validateConnectingFlights(newProviders, true);
            setValidationError(validation.valid ? null : validation.error);
            
            if (!isRouteComplete(newProviders)) {
                setModalOpen(false);
            }
        }
        setRemovalConfirmation(null);
    };

    const routePath = route.map(leg => leg.routeInfo.from.name).concat(route[route.length - 1].routeInfo.to.name);

    // create booking object with validation
    const booking = selectedProviders && 
        selectedProviders.length === route.length && 
        selectedProviders.some(provider => provider !== null) ? {
        route: route.map((leg, index) => {
            const provider = selectedProviders[index];
            if (!provider) return null;
            return {
                from: leg.routeInfo.from.name,
                to: leg.routeInfo.to.name,
                provider: provider.company.name,
                price: provider.price,
                departure: new Date(provider.flightStart).toLocaleString(),
                arrival: new Date(provider.flightEnd).toLocaleString()
            };
        }).filter(segment => segment !== null),
        totalPrice: details.price,
        totalTime: details.time,
        totalDistance: details.distance,
        bookingDate: new Date().toISOString()
    } : null;


    // return all of the UI stuff
  return (
        <Box sx={{ 
            border: '1px solid var(--celestial-blue)',
            borderRadius: '4px',
            padding: '16px',
            backgroundColor: 'var(--prussian-blue)',
            marginBottom: '16px'
        }}>
            {/* Route overview */}
            <Box 
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    '&:hover': {
                        opacity: 0.8
                    }
                }}
            >
                <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    minWidth: 0
                }}>
                    {routePath.map((planet, index) => (
                        <Box 
                            key={index} 
                            sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexShrink: 0
                            }}
                        >
                            <Typography sx={{ 
                                color: 'var(--celestial-blue)', 
                                fontSize: {
                                    xs: '0.9rem',
                                    sm: '1.1rem'
                                },
                                fontWeight: index === 0 || index === routePath.length - 1 ? 'bold' : 'normal'
                            }}>
                                {planet}
                            </Typography>
                            {index < routePath.length - 1 && (
                                <RocketLaunchIcon sx={{ 
                                    color: 'var(--celestial-blue)',
                                    fontSize: {
                                        xs: '1rem',
                                        sm: '1.2rem'
                                    }
                                }} />
                            )}
                        </Box>
                    ))}
                </Box>
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    color: 'var(--celestial-blue)',
                    flexShrink: 0,
                    alignItems: 'flex-start'
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 0.5
                    }}>
                        <Typography sx={{ 
                            fontSize: {
                                xs: '0.8rem',
                                sm: '0.9rem'
                            },
                            whiteSpace: 'nowrap'
                        }}>
                            {details.time} hours
                        </Typography>
                        <Typography sx={{ 
                            fontWeight: 'bold',
                            fontSize: {
                                xs: '0.8rem',
                                sm: '0.9rem'
                            },
                            whiteSpace: 'nowrap'
                        }}>
                            €{details.price.toLocaleString()}
                        </Typography>
                    </Box>
                    {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </Box>
            </Box>

            {/* Collapsible segments */}
            <Collapse in={isExpanded}>
                <Box sx={{ mt: 2 }}>
                    {route.map((leg, legIndex) => (
                        <Box key={legIndex} sx={{ 
                            mt: 2,
                            borderTop: legIndex === 0 ? `1px solid var(--celestial-blue)` : 'none',
                            pt: 2
                        }}>
                            <Typography sx={{ 
                                color: 'var(--celestial-blue)', 
                                fontSize: '0.9rem',
                                mb: 1,
                                opacity: 0.8
                            }}>
                                {leg.routeInfo.from.name} → {leg.routeInfo.to.name}
                            </Typography>

                            {/* Provider options */}
                            <Box sx={{ pl: 2 }}>
                                {leg.providers
                                    .sort((a, b) => {
                                        if (filter === 'fastest') {
                                            const aTime = new Date(a.flightEnd) - new Date(a.flightStart);
                                            const bTime = new Date(b.flightEnd) - new Date(b.flightStart);
                                            return aTime - bTime;
                                        } else {
                                            return a.price - b.price;
                                        }
                                    })
                                    .map((provider, providerIndex) => (
                                        <Box 
                                            key={providerIndex} 
                                            onClick={() => {
                                                const newProviders = [...selectedProviders];
                                                if (selectedProviders[legIndex] === provider) {
                                                    newProviders[legIndex] = null;
                                                    setSelectedProviders(newProviders);
                                                    setValidationError(null);
                                                    return;
                                                }

                                                let isValid = true;
                                                let error = null;

                                                let prevEnd = null;
                                                let nextStart = null;
                                                for (let i = legIndex - 1; i >= 0; i--) {
                                                    if (newProviders[i]) {
                                                        prevEnd = new Date(newProviders[i].flightEnd);
                                                        break;
                                                    }
                                                }
                                                for (let i = legIndex + 1; i < newProviders.length; i++) {
                                                    if (newProviders[i]) {
                                                        nextStart = new Date(newProviders[i].flightStart);
                                                        break;
                                                    }
                                                }

                                                const newStart = new Date(provider.flightStart);
                                                const newEnd = new Date(provider.flightEnd);

                                                if (newEnd <= newStart) {
                                                    isValid = false;
                                                    error = `Invalid flight: Arrival time must be after departure time`;
                                                }

                                                if (prevEnd) {
                                                    const waitTime = (newStart - prevEnd) / (1000 * 60 * 60);
                                                    if (waitTime < 1) {
                                                        isValid = false;
                                                        error = `Not enough time after previous flight (${Math.round(waitTime * 100) / 100} hours). Need at least 1 hour between flights.`;
                                                    }
                                                    if (waitTime > 48) {
                                                        isValid = false;
                                                        error = `Too much waiting time after previous flight (${Math.floor(waitTime)} hours). Maximum wait time is 48 hours.`;
                                                    }
                                                }

                                                if (nextStart) {
                                                    const waitTime = (nextStart - newEnd) / (1000 * 60 * 60);
                                                    if (waitTime < 1) {
                                                        isValid = false;
                                                        error = `Not enough time before next flight (${Math.round(waitTime * 100) / 100} hours). Need at least 1 hour between flights.`;
                                                    }
                                                    if (waitTime > 48) {
                                                        isValid = false;
                                                        error = `Too much waiting time before next flight (${Math.floor(waitTime)} hours). Maximum wait time is 48 hours.`;
                                                    }
                                                }

                                                newProviders[legIndex] = provider;
                                                setSelectedProviders(newProviders);
                                                setValidationError(error);
                                            }}
                                            sx={{
                                                padding: '8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedProviders[legIndex] === provider ? 
                                                    (validationError ? 'rgba(255, 107, 107, 0.1)' : 'var(--indigo-dye)') : 'transparent',
                                                border: selectedProviders[legIndex] === provider ? 
                                                    (validationError ? '1px solid #ff6b6b' : '1px solid var(--celestial-blue)') : '1px solid transparent',
                                                '&:hover': {
                                                    backgroundColor: selectedProviders[legIndex] === provider ? 
                                                        (validationError ? 'rgba(255, 107, 107, 0.2)' : 'var(--prussian-blue)') : 'var(--indigo-dye)',
                                                    border: selectedProviders[legIndex] === provider ? 
                                                        (validationError ? '1px solid #ff6b6b' : '1px solid var(--celestial-blue)') : '1px solid var(--celestial-blue)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                gap: 2,
                                                minWidth: 0
                                            }}>
                                                <Typography sx={{ 
                                                    color: 'var(--celestial-blue)', 
                                                    fontSize: '0.9rem',
                                                    minWidth: 0,
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {provider.company.name}
                                                </Typography>
                                                <Typography sx={{ 
                                                    color: 'var(--celestial-blue)', 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: 'bold',
                                                    flexShrink: 0
                                                }}>
                                                    €{provider.price.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                gap: 2,
                                                mt: 0.5
                                            }}>
                                                <Typography sx={{ 
                                                    color: 'var(--celestial-blue)', 
                                                    fontSize: '0.8rem',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {new Date(provider.flightStart).toLocaleString()}
                                                </Typography>
                                                <Typography sx={{ 
                                                    color: 'var(--celestial-blue)', 
                                                    fontSize: '0.8rem',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    textAlign: 'right'
                                                }}>
                                                    {new Date(provider.flightEnd).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                            </Box>
                        </Box>
                    ))}

                    {/* Route summary */}
                    <Box sx={{ 
                        borderTop: '1px solid var(--celestial-blue)',
                        marginTop: '16px',
                        paddingTop: '16px'
                    }}>
                        {validationError && (
                            <Typography sx={{ 
                                color: '#ff6b6b',
                                mb: 2,
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                ⚠️ {validationError}
                            </Typography>
                        )}
                        
                        <Box sx={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2
                        }}>
                            <Box sx={{ 
                                display: 'flex',
                                gap: 3,
                                flexWrap: 'wrap'
                            }}>
                                <Typography sx={{ color: 'var(--celestial-blue)' }}>
                                    Total Distance: {details.distance.toLocaleString()} km
                                </Typography>
                                <Typography sx={{ color: 'var(--celestial-blue)' }}>
                                    Total Time: {details.time} hours
                                </Typography>
                                <Typography sx={{ color: 'var(--celestial-blue)', fontWeight: 'bold' }}>
                                    Total Price: €{details.price.toLocaleString()}
                                </Typography>
                            </Box>
                            
                            <Button
                                variant="contained"
                                onClick={() => setModalOpen(true)}
                                disabled={!!validationError || !selectedProviders.some(provider => provider !== null)}
                                sx={{
                                    backgroundColor: 'var(--celestial-blue)',
                                    color: 'var(--prussian-blue)',
                                    '&:hover': {
                                        backgroundColor: 'var(--indigo-dye)',
                                        color: 'var(--celestial-blue)'
                                    },
                                    '&.Mui-disabled': {
                                        backgroundColor: 'var(--indigo-dye)',
                                        opacity: 0.5
                                    }
                                }}
                            >
                                Buy Tickets
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Collapse>

            {/* Booking Confirmation Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                aria-labelledby="booking-confirmation-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    bgcolor: 'var(--prussian-blue)',
                    border: '2px solid var(--celestial-blue)',
                    borderRadius: '4px',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography variant="h6" component="h2" sx={{ 
                        color: 'var(--celestial-blue)',
                        borderBottom: '1px solid var(--celestial-blue)',
                        pb: 2,
                        mb: 3
                    }}>
                        Confirm Your Booking
                    </Typography>

                    {/* Route Segments */}
                    {booking && booking.route.map((segment, index) => (
                        <Box key={index} sx={{ 
                            mb: 3,
                            position: 'relative',
                            '&:hover .remove-button': {
                                opacity: 1
                            },
                            border: validationError ? '1px solid #ff6b6b' : '1px solid transparent',
                            padding: '12px',
                            borderRadius: '4px',
                            backgroundColor: validationError ? 'rgba(255, 107, 107, 0.1)' : 'transparent'
                        }}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}>
                                <Typography sx={{ 
                                    color: 'var(--celestial-blue)',
                                    fontWeight: 'bold',
                                    mb: 1
                                }}>
                                    {segment.from} → {segment.to}
                                </Typography>
                                <Button
                                    className="remove-button"
                                    onClick={() => {
                                        const newProviders = [...selectedProviders];
                                        const segmentToRemove = booking.route[index];
                                        handleRemoveSegment(index, segmentToRemove, newProviders);
                                    }}
                                    sx={{
                                        minWidth: 'auto',
                                        p: 0.5,
                                        color: 'var(--celestial-blue)',
                                        opacity: {
                                            xs: 1,
                                            sm: 0
                                        },
                                        transition: 'opacity 0.2s, color 0.2s',
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            color: '#ff6b6b'
                                        }
                                    }}
                                >
                                    ✕
                                </Button>
                            </Box>
                            <Box sx={{ pl: 2 }}>
                                <Typography sx={{ color: 'var(--celestial-blue)', fontSize: '0.9rem' }}>
                                    Provider: {segment.provider}
                                </Typography>
                                <Typography sx={{ color: 'var(--celestial-blue)', fontSize: '0.9rem' }}>
                                    Departure: {segment.departure}
                                </Typography>
                                <Typography sx={{ color: 'var(--celestial-blue)', fontSize: '0.9rem' }}>
                                    Arrival: {segment.arrival}
                                </Typography>
                                <Typography sx={{ color: 'var(--celestial-blue)', fontSize: '0.9rem' }}>
                                    Price: €{segment.price.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    {/* Journey Summary */}
                    {booking && booking.route.length > 0 && (
                        <Box sx={{ 
                            borderTop: '1px solid var(--celestial-blue)',
                            pt: 2,
                            mt: 2
                        }}>
                            <Typography sx={{ color: 'var(--celestial-blue)' }}>
                                Total Distance: {booking.totalDistance.toLocaleString()} km
                            </Typography>
                            <Typography sx={{ color: 'var(--celestial-blue)' }}>
                                Total Time: {booking.totalTime} hours
                            </Typography>
                            <Typography sx={{ 
                                color: 'var(--celestial-blue)',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                mt: 1
                            }}>
                                Total Price: €{booking.totalPrice.toLocaleString()}
                            </Typography>
                        </Box>
                    )}

                    {/* Passenger Information */}
                    <Box sx={{ 
                        borderTop: '1px solid var(--celestial-blue)',
                        pt: 2,
                        mt: 2,
                        mb: 2
                    }}>
                        <Typography sx={{ 
                            color: 'var(--celestial-blue)',
                            fontWeight: 'bold',
                            mb: 2
                        }}>
                            Passenger Information
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: {
                                xs: 'column',
                                sm: 'row'
                            },
                            gap: 2
                        }}>
                            <TextField
                                label="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                error={nameError && !firstName.trim()}
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'var(--celestial-blue)',
                                        '& fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'var(--celestial-blue)',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: 'var(--celestial-blue)',
                                    },
                                }}
                            />
                            <TextField
                                label="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                error={nameError && !lastName.trim()}
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'var(--celestial-blue)',
                                        '& fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'var(--celestial-blue)',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'var(--celestial-blue)',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: 'var(--celestial-blue)',
                                    },
                                }}
                            />
                        </Box>
                        {nameError && (
                            <Typography sx={{ 
                                color: '#ff6b6b',
                                fontSize: '0.8rem',
                                mt: 1
                            }}>
                                {nameError}
                            </Typography>
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ 
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        mt: 3
                    }}>
                        <Button
                            onClick={() => setModalOpen(false)}
                            sx={{
                                color: 'var(--celestial-blue)',
                                borderColor: 'var(--celestial-blue)',
                                '&:hover': {
                                    backgroundColor: 'var(--indigo-dye)',
                                    borderColor: 'var(--celestial-blue)'
                                }
                            }}
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!firstName.trim() || !lastName.trim()) {
                                    setNameError('Please enter both first and last name');
                                    return;
                                }
                                setNameError(null);

                                const validProviders = selectedProviders.filter(provider => provider !== null);
                                if (validProviders.length === 0) {
                                    setValidationError("Please select at least one flight segment");
                                    return;
                                }

                                for (let i = 0; i < validProviders.length - 1; i++) {
                                    const currentFlight = validProviders[i];
                                    const nextFlight = validProviders[i + 1];
                                    
                                    const currentEnd = new Date(currentFlight.flightEnd);
                                    const nextStart = new Date(nextFlight.flightStart);
                                    
                                    if (nextStart < currentEnd) {
                                        setValidationError(`Invalid flight sequence: ${route[i].routeInfo.to.name} → ${route[i + 1].routeInfo.to.name} starts before previous flight ends`);
                                        return;
                                    }

                                    if (nextStart < new Date(validProviders[0].flightStart)) {
                                        setValidationError(`Invalid flight sequence: ${route[i + 1].routeInfo.from.name} → ${route[i + 1].routeInfo.to.name} starts before the first flight`);
                                        return;
                                    }

                                    const waitTime = (nextStart - currentEnd) / (1000 * 60 * 60);
                                    if (waitTime < 1) {
                                        setValidationError(`Not enough time between flights (${Math.round(waitTime * 100) / 100} hours). Need at least 1 hour between flights.`);
                                        return;
                                    }
                                    if (waitTime > 48) {
                                        setValidationError(`Too much waiting time (${Math.floor(waitTime)} hours). Maximum wait time is 48 hours.`);
                                        return;
                                    }
                                }

                                const validation = validateConnectingFlights(selectedProviders, true);
                                if (!validation.valid) {
                                    setValidationError(validation.error);
                                    return;
                                }

                                const newReservation = {
                                    passenger: {
                                        firstName: firstName.trim(),
                                        lastName: lastName.trim()
                                    },
                                    route: route.map((leg, index) => {
                                        const provider = selectedProviders[index];
                                        if (!provider) return null;
                                        return {
                                            from: leg.routeInfo.from.name,
                                            to: leg.routeInfo.to.name,
                                            provider: provider.company.name,
                                            price: provider.price,
                                            departure: new Date(provider.flightStart).toLocaleString(),
                                            arrival: new Date(provider.flightEnd).toLocaleString()
                                        };
                                    }).filter(segment => segment !== null),
                                    totalPrice: details.price,
                                    totalTime: details.time,
                                    totalDistance: details.distance
                                };

                                addReservation(newReservation);
                                console.log('Booking confirmed:', newReservation);
                                setModalOpen(false);
                                setFirstName('');
                                setLastName('');
                                setNameError(null);
                                alert('Booking confirmed! View your reservation in the Reservations page.');
                            }}
                            sx={{
                                backgroundColor: 'var(--celestial-blue)',
                                color: 'var(--prussian-blue)',
                                '&:hover': {
                                    backgroundColor: 'var(--indigo-dye)',
                                    color: 'var(--celestial-blue)'
                                }
                            }}
                            variant="contained"
                        >
                            Confirm Booking
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Removal Confirmation Dialog */}
            <Dialog
                open={Boolean(removalConfirmation)}
                onClose={() => handleRemovalConfirmationClose(false)}
                PaperProps={{
                    sx: {
                        bgcolor: 'var(--prussian-blue)',
                        color: 'var(--celestial-blue)',
                        border: '1px solid var(--celestial-blue)',
                        minWidth: {
                            xs: '90%',
                            sm: '500px'
                        }
                    }
                }}
            >
                <DialogTitle sx={{ 
                    borderBottom: '1px solid var(--celestial-blue)',
                    '& .MuiTypography-root': {
                        fontSize: {
                            xs: '1.1rem',
                            sm: '1.3rem'
                        }
                    }
                }}>
                    Remove Flight Segment
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <DialogContentText sx={{ 
                        color: 'var(--celestial-blue)',
                        mb: 2,
                        opacity: 0.9
                    }}>
                        Are you sure you want to remove this flight segment?
                    </DialogContentText>
                    {removalConfirmation && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography sx={{ 
                                    fontWeight: 'bold',
                                    mb: 1
                                }}>
                                    Flight to remove:
                                </Typography>
                                <Box sx={{ 
                                    pl: 2,
                                    py: 1,
                                    border: '1px solid var(--celestial-blue)',
                                    borderRadius: '4px',
                                    bgcolor: 'rgba(255, 107, 107, 0.1)'
                                }}>
                                    <Typography>
                                        From: {removalConfirmation.segment.from}
                                    </Typography>
                                    <Typography>
                                        To: {removalConfirmation.segment.to}
                                    </Typography>
                                    <Typography>
                                        Provider: {removalConfirmation.segment.provider}
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography sx={{ 
                                fontWeight: 'bold',
                                mb: 1
                            }}>
                                Your journey after removal:
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                                {removalConfirmation.routeGap.map((segment, idx) => (
                                    <Typography 
                                        key={idx}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            color: segment.gap ? '#ff6b6b' : 'var(--celestial-blue)',
                                            mb: 0.5
                                        }}
                                    >
                                        {segment.gap ? '⚠️' : '✓'} {segment.from} → {segment.to}
                                    </Typography>
                                ))}
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ 
                    p: 2,
                    borderTop: '1px solid var(--celestial-blue)'
                }}>
                    <Button 
                        onClick={() => handleRemovalConfirmationClose(false)}
                        sx={{
                            color: 'var(--celestial-blue)',
                            borderColor: 'var(--celestial-blue)',
                            '&:hover': {
                                backgroundColor: 'var(--indigo-dye)',
                                borderColor: 'var(--celestial-blue)'
                            }
                        }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleRemovalConfirmationClose(true)}
                        sx={{
                            backgroundColor: '#ff6b6b',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#ff4f4f'
                            }
                        }}
                        variant="contained"
                    >
                        Remove Segment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Main component for displaying search results
export default function Results({ searchResults, searchSuccess }) {
    const [filter, setFilter] = React.useState('fastest');
    const [directOnly, setDirectOnly] = React.useState(false);
    const [routes, setRoutes] = React.useState([]);
    const [rawRoutes, setRawRoutes] = React.useState([]);
    const [selectedCompanies, setSelectedCompanies] = React.useState(() => new Set());
    const [availableCompanies, setAvailableCompanies] = React.useState([]);

    // Process search results into raw routes and extract companies
    React.useEffect(() => {
        if (!searchResults?.legs?.length || !searchResults.selectedRoute) {
            setRawRoutes([]);
            setRoutes([]);
            setAvailableCompanies([]);
            setSelectedCompanies(new Set());
            return;
        }
        
        const companies = new Set();
        searchResults.legs.forEach(leg => {
            leg.providers.forEach(provider => {
                companies.add(provider.company.name);
            });
        });
        const sortedCompanies = Array.from(companies).sort();
        setAvailableCompanies(sortedCompanies);
        setSelectedCompanies(new Set(sortedCompanies));
        
        setTimeout(() => {
            const fromPlanet = searchResults.selectedRoute.from;
            const toPlanet = searchResults.selectedRoute.to;
            const allRoutes = findAllRoutes(searchResults.legs, fromPlanet, toPlanet);
            setRawRoutes(allRoutes);
        }, 100);
    }, [searchResults]);

    // Process raw routes based on filters
    React.useEffect(() => {
        if (rawRoutes.length === 0) {
            setRoutes([]);
            return;
        }
        
        setTimeout(() => {
            let filteredByDirect = rawRoutes;
            if (directOnly) {
                filteredByDirect = rawRoutes.filter(route => route.length === 1);
            }

            const routesWithDetails = filteredByDirect.map(route => {
                const bestProviders = findBestProviderCombination(route, filter, selectedCompanies);
                if (!bestProviders || bestProviders.length === 0 || bestProviders.some(p => !p)) {
                    return null;
                }
                const details = calculateRouteDetails(route, bestProviders);
                return { route, details };
            }).filter(Boolean);

            const sortedRoutes = routesWithDetails.sort((a, b) => {
                if (filter === 'fastest') {
                    return a.details.time - b.details.time;
                } else {
                    return a.details.price - b.details.price;
                }
            });

            setRoutes(sortedRoutes.map(r => r.route));
        }, 100);
    }, [rawRoutes, filter, directOnly, selectedCompanies]);

    if (!searchResults || !searchResults.legs || searchResults.legs.length === 0 || !searchResults.selectedRoute) {
        return searchSuccess ? (
            <Slide direction="up" in={searchSuccess} mountOnEnter unmountOnExit timeout={600}>
                <div style={{
                    backgroundColor: 'var(--prussian-blue)',
                    color: 'var(--celestial-blue)',
                    padding: '20px',
                    textAlign: 'center',
                    marginTop: '20px',
                    borderRadius: '4px',
                    border: '1px solid var(--celestial-blue)'
                }}>
                    No routes found between these planets. (Or route is too long!)
                </div>
            </Slide>
        ) : null;
    }

    return (
        <Slide direction="up" in={searchSuccess} mountOnEnter unmountOnExit timeout={600}>
            <Box sx={{ 
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px'
            }}>
                {/* Filters */}
                <Box sx={{ 
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap'
                    }}>
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={(event, newFilter) => {
                                if (newFilter !== null) {
                                    setFilter(newFilter);
                                }
                            }}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    color: 'var(--celestial-blue)',
                                    borderColor: 'var(--celestial-blue)',
                                    '&.Mui-selected': {
                                        backgroundColor: 'var(--indigo-dye)',
                                        color: 'var(--celestial-blue)',
                                        '&:hover': {
                                            backgroundColor: 'var(--indigo-dye)',
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: 'var(--indigo-dye)',
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="fastest">Fastest</ToggleButton>
                            <ToggleButton value="cheapest">Cheapest</ToggleButton>
                        </ToggleButtonGroup>

                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--celestial-blue)',
                            gap: 1,
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => setDirectOnly(!directOnly)}
                        >
                            <input
                                type="checkbox"
                                checked={directOnly}
                                onChange={(e) => setDirectOnly(e.target.checked)}
                                style={{
                                    cursor: 'pointer',
                                    width: '18px',
                                    height: '18px'
                                }}
                            />
                            <span>Direct Routes Only</span>
                        </Box>
                    </Box>

                    {/* Company Filters */}
                    {availableCompanies.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            width: '100%'
                        }}>
                            <Typography sx={{ 
                                color: 'var(--celestial-blue)',
                                fontSize: '0.9rem',
                                opacity: 0.9
                            }}>
                                Filter by Companies {selectedCompanies.size > 0 && `(${selectedCompanies.size} selected)`}
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                justifyContent: 'center'
                            }}>
                                {availableCompanies.map(company => (
                                    <Chip
                                        key={company}
                                        label={company}
                                        onClick={() => {
                                            const newSelected = new Set(selectedCompanies);
                                            if (newSelected.has(company)) {
                                                newSelected.delete(company);
                                            } else {
                                                newSelected.add(company);
                                            }
                                            setSelectedCompanies(newSelected);
                                        }}
                                        sx={{
                                            backgroundColor: selectedCompanies.has(company) ? 'var(--celestial-blue)' : 'var(--prussian-blue)',
                                            color: selectedCompanies.has(company) ? 'var(--prussian-blue)' : 'var(--celestial-blue)',
                                            border: '1px solid var(--celestial-blue)',
                                            '&:hover': {
                                                backgroundColor: selectedCompanies.has(company) ? 'var(--celestial-blue)' : 'var(--indigo-dye)',
                                            }
                                        }}
                                    />
                                ))}
                                {selectedCompanies.size > 0 && (
                                    <Chip
                                        label="Clear All"
                                        onClick={() => setSelectedCompanies(new Set())}
                                        sx={{
                                            backgroundColor: 'transparent',
                                            color: 'var(--celestial-blue)',
                                            border: '1px solid var(--celestial-blue)',
                                            '&:hover': {
                                                backgroundColor: 'var(--indigo-dye)',
                                            }
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Routes */}
                {routes.length > 0 ? (
                    routes.map((route, index) => (
                        <ErrorBoundary key={index}>
                            <RouteOption route={route} filter={filter} selectedCompanies={selectedCompanies} />
                        </ErrorBoundary>
                    ))
                ) : (
                    <Box sx={{
                        backgroundColor: 'var(--prussian-blue)',
                        color: 'var(--celestial-blue)',
                        padding: '20px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        border: '1px solid var(--celestial-blue)'
                    }}>
                        {selectedCompanies.size > 0 
                            ? `No routes found with selected companies${directOnly ? ' (direct routes only)' : ''}.`
                            : `No ${directOnly ? 'direct ' : ''}routes found between these planets.`
                        }
                    </Box>
                )}
            </Box>
        </Slide>
    );
}