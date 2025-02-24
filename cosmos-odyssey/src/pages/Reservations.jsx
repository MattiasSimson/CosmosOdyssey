import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import Alert from '@mui/material/Alert';


import { 
    getAllReservations, 
    deleteReservation, 
    getDbStats,
    exportDb,
    clearDb,
    getAllPricelists 
} from '../utils/db';
import '../Colors.css';
import Timer from '../components/Timer';

// Helper function to get pricelist status
function getPricelistStatus(pricelists, pricelistId) {
    const pricelist = pricelists.find(pl => pl.id === pricelistId);
    if (!pricelist) return { status: 'expired' };
    
    const validUntil = new Date(pricelist.validUntil);
    const now = new Date();
    
    if (validUntil <= now) return { status: 'expired' };
    
    const pricelistIndex = pricelists.findIndex(pl => pl.id === pricelistId);
    
    if (pricelistIndex >= 12) {
        return { 
            status: 'warning',
            expiryDate: validUntil
        };
    }
    
    return { 
        status: 'active',
        expiryDate: validUntil
    };
}

// Component for displaying reservations
export default function Reservations() {
    const [reservations, setReservations] = React.useState([]);
    const [stats, setStats] = React.useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedReservation, setSelectedReservation] = React.useState(null);
    const [clearDialogOpen, setClearDialogOpen] = React.useState(false);
    const [pricelists, setPricelists] = React.useState([]);

    // Load data from database
    const loadData = React.useCallback(() => {
        const allReservations = getAllReservations();
        const allPricelists = getAllPricelists();
        setReservations(allReservations);
        setPricelists(allPricelists);
        setStats(getDbStats());
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Group reservations by passenger name
    const groupedReservations = React.useMemo(() => {
        const groups = {};
        reservations.forEach(reservation => {
            const fullName = `${reservation.passenger.firstName} ${reservation.passenger.lastName}`;
            if (!groups[fullName]) {
                groups[fullName] = [];
            }
            groups[fullName].push(reservation);
        });
        return groups;
    }, [reservations]);

    // Handle reservation deletion
    const handleDelete = () => {
        if (selectedReservation) {
            deleteReservation(selectedReservation.id);
            loadData();
            setDeleteDialogOpen(false);
            setSelectedReservation(null);
        }
    };

    // Handle database clear
    const handleClearDb = () => {
        clearDb();
        loadData();
        setClearDialogOpen(false);
    };

    return (
        <Box sx={{ 
            padding: '20px',
            marginTop: '64px',
            maxWidth: '1200px',
            margin: '64px auto 0',
            width: '100%'
        }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="h4" sx={{ 
                    color: 'var(--celestial-blue)',
                }}>
                    Your Reservations
                </Typography>

                {stats && (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 2,
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Typography sx={{ 
                            color: 'var(--celestial-blue)',
                            fontSize: '0.9rem'
                        }}>
                            Total Reservations: {stats.totalReservations}
                        </Typography>
                        <Typography sx={{ 
                            color: 'var(--celestial-blue)',
                            fontSize: '0.9rem'
                        }}>
                            Unique Passengers: {stats.uniquePassengers}
                        </Typography>
                        <Button
                            startIcon={<GetAppIcon />}
                            onClick={exportDb}
                            sx={{
                                color: 'var(--celestial-blue)',
                                borderColor: 'var(--celestial-blue)',
                                '&:hover': {
                                    backgroundColor: 'var(--indigo-dye)',
                                    borderColor: 'var(--celestial-blue)'
                                }
                            }}
                            variant="outlined"
                            size="small"
                        >
                            Export
                        </Button>
                        <Button
                            startIcon={<DeleteIcon />}
                            onClick={() => setClearDialogOpen(true)}
                            sx={{
                                color: '#ff6b6b',
                                borderColor: '#ff6b6b',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                    borderColor: '#ff6b6b'
                                }
                            }}
                            variant="outlined"
                            size="small"
                        >
                            Clear All
                        </Button>
                    </Box>
                )}
            </Box>

            <Alert severity="info" sx={{ mb: 3, backgroundColor: 'var(--prussian-blue)', color: 'var(--celestial-blue)' }}>
                Reservations are tied to their original pricelist. When a pricelist is no longer in the last 15 active pricelists, 
                its reservations will be automatically removed. Watch for the status indicators to know when your reservations might expire.
            </Alert>

            {Object.keys(groupedReservations).length === 0 ? (
                <Box sx={{
                    backgroundColor: 'var(--prussian-blue)',
                    color: 'var(--celestial-blue)',
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '4px',
                    border: '1px solid var(--celestial-blue)'
                }}>
                    No reservations found. Start booking your space travels!
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(groupedReservations).map(([passengerName, passengerReservations]) => (
                        <Accordion 
                            key={passengerName}
                            sx={{
                                backgroundColor: 'var(--prussian-blue)',
                                color: 'var(--celestial-blue)',
                                border: '1px solid var(--celestial-blue)',
                                '&:before': {
                                    display: 'none',
                                }
                            }}
                            defaultExpanded={passengerReservations.length === 1}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: 'var(--celestial-blue)' }} />}
                                sx={{
                                    '& .MuiAccordionSummary-content': {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%'
                                    },
                                    borderBottom: passengerReservations.length > 1 ? '1px solid var(--celestial-blue)' : 'none'
                                }}
                            >
                                <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {passengerName}
                                </Typography>
                                <Typography sx={{ color: 'var(--celestial-blue)', opacity: 0.8 }}>
                                    {passengerReservations.length} {passengerReservations.length === 1 ? 'reservation' : 'reservations'}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TableContainer component={Paper} sx={{
                                    backgroundColor: 'transparent',
                                    '& .MuiTableCell-root': {
                                        color: 'var(--celestial-blue)',
                                        borderColor: 'var(--celestial-blue)',
                                        padding: {
                                            xs: '8px',
                                            sm: '16px'
                                        },
                                        fontSize: {
                                            xs: '0.8rem',
                                            sm: '1rem'
                                        }
                                    }
                                }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Booking Date</TableCell>
                                                <TableCell>Route</TableCell>
                                                <TableCell>Companies</TableCell>
                                                <TableCell>Total Price</TableCell>
                                                <TableCell>Travel Time</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {passengerReservations.map((reservation) => {
                                                const statusInfo = getPricelistStatus(pricelists, reservation.pricelistId);
                                                return (
                                                    <TableRow 
                                                        key={reservation.id}
                                                        sx={{
                                                            opacity: statusInfo.status === 'expired' ? 0.6 : 1,
                                                            backgroundColor: statusInfo.status === 'warning' ? 'rgba(255, 183, 77, 0.1)' : 'transparent'
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Timer 
                                                                expiryDate={statusInfo.expiryDate} 
                                                                status={statusInfo.status}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(reservation.createdAt || reservation.bookingDate).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            {reservation.route.map((segment, idx) => (
                                                                <div key={idx}>
                                                                    {segment.from} → {segment.to}
                                                                </div>
                                                            ))}
                                                        </TableCell>
                                                        <TableCell>
                                                            {reservation.route.map((segment, idx) => (
                                                                <div key={idx}>{segment.provider}</div>
                                                            ))}
                                                        </TableCell>
                                                        <TableCell>€{reservation.totalPrice.toLocaleString()}</TableCell>
                                                        <TableCell>{reservation.totalTime} hours</TableCell>
                                                        <TableCell align="right">
                                                            <IconButton
                                                                onClick={() => {
                                                                    setSelectedReservation(reservation);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                sx={{
                                                                    color: '#ff6b6b',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        backgroundColor: 'var(--prussian-blue)',
                        color: 'var(--celestial-blue)',
                        border: '1px solid var(--celestial-blue)'
                    }
                }}
            >
                <DialogTitle>Delete Reservation</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--celestial-blue)' }}>
                        Are you sure you want to delete this reservation? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{
                            color: 'var(--celestial-blue)'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete}
                        sx={{
                            color: '#ff6b6b'
                        }}
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Clear All Confirmation Dialog */}
            <Dialog
                open={clearDialogOpen}
                onClose={() => setClearDialogOpen(false)}
                sx={{
                    '& .MuiDialog-paper': {
                        backgroundColor: 'var(--prussian-blue)',
                        color: 'var(--celestial-blue)',
                        border: '1px solid var(--celestial-blue)'
                    }
                }}
            >
                <DialogTitle>Clear All Reservations</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--celestial-blue)' }}>
                        Are you sure you want to delete all reservations? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setClearDialogOpen(false)}
                        sx={{
                            color: 'var(--celestial-blue)'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleClearDb}
                        sx={{
                            color: '#ff6b6b'
                        }}
                        autoFocus
                    >
                        Clear All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}