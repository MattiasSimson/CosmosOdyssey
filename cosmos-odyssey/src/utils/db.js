import initialDb from './db.json';

const MAX_PRICELISTS = 15;

// Initialize database in localStorage if it doesn't exist
const initializeDb = () => {
    const existingDb = localStorage.getItem('cosmosOdysseyDb');
    const defaultDb = {
        reservations: [],
        pricelists: [],
        lastUpdated: new Date().toISOString(),
        version: '1.0'
    };

    if (!existingDb) {
        localStorage.setItem('cosmosOdysseyDb', JSON.stringify(defaultDb));
        return defaultDb;
    }

    try {
        const parsedDb = JSON.parse(existingDb);
        // Ensure all required fields exist
        const updatedDb = {
            ...defaultDb,
            ...parsedDb,
            reservations: parsedDb.reservations || [],
            pricelists: parsedDb.pricelists || []
        };
        localStorage.setItem('cosmosOdysseyDb', JSON.stringify(updatedDb));
        return updatedDb;
    } catch (error) {
        console.error('Error parsing database:', error);
        localStorage.setItem('cosmosOdysseyDb', JSON.stringify(defaultDb));
        return defaultDb;
    }
};

// Add new pricelist and cleanup old reservations
export const addPricelist = (pricelist) => {
    const db = initializeDb();
    
    // Add new pricelist to the front
    db.pricelists.unshift({
        ...pricelist,
        id: pricelist.id || generateId(),
        validUntil: pricelist.validUntil || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Keep only the last 15 pricelists
    if (db.pricelists.length > MAX_PRICELISTS) {
        const removedPricelists = db.pricelists.splice(MAX_PRICELISTS);
        
        // Remove reservations associated with old pricelists
        db.reservations = db.reservations.filter(reservation => 
            !removedPricelists.some(pl => pl.id === reservation.pricelistId)
        );
    }
    
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem('cosmosOdysseyDb', JSON.stringify(db));
    return db.pricelists[0];
};

// Get current pricelist
export const getCurrentPricelist = () => {
    const db = initializeDb();
    return db.pricelists[0] || null;
};

// Get all pricelists
export const getAllPricelists = () => {
    const db = initializeDb();
    return db.pricelists;
};

// Get all reservations
export const getAllReservations = () => {
    const db = initializeDb();
    return db.reservations;
};

// Get reservations by passenger name
export const getReservationsByPassenger = (firstName, lastName) => {
    const db = initializeDb();
    return db.reservations.filter(
        reservation => 
            reservation.passenger.firstName.toLowerCase() === firstName.toLowerCase() &&
            reservation.passenger.lastName.toLowerCase() === lastName.toLowerCase()
    );
};

// Add new reservation
export const addReservation = (reservation) => {
    const db = initializeDb();
    const currentPricelist = getCurrentPricelist();
    
    if (!currentPricelist) {
        throw new Error('No active pricelist found');
    }
    
    const newReservation = {
        ...reservation,
        id: generateId(),
        pricelistId: currentPricelist.id,
        createdAt: new Date().toISOString()
    };
    
    db.reservations.push(newReservation);
    db.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('cosmosOdysseyDb', JSON.stringify(db));
    return newReservation;
};

// Delete reservation by ID
export const deleteReservation = (reservationId) => {
    const db = initializeDb();
    db.reservations = db.reservations.filter(r => r.id !== reservationId);
    db.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('cosmosOdysseyDb', JSON.stringify(db));
    return true;
};

// Update reservation
export const updateReservation = (reservationId, updates) => {
    const db = initializeDb();
    const index = db.reservations.findIndex(r => r.id === reservationId);
    
    if (index === -1) return false;
    
    db.reservations[index] = {
        ...db.reservations[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem('cosmosOdysseyDb', JSON.stringify(db));
    return db.reservations[index];
};

// Helper function to generate unique IDs
const generateId = () => {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Get database statistics
export const getDbStats = () => {
    const db = initializeDb();
    return {
        totalReservations: db?.reservations?.length || 0,
        lastUpdated: db?.lastUpdated || new Date().toISOString(),
        version: db?.version || '1.0',
        uniquePassengers: new Set(
            (db?.reservations || []).map(r => `${r?.passenger?.firstName || ''} ${r?.passenger?.lastName || ''}`)
        ).size,
        activePricelists: db?.pricelists?.length || 0
    };
};

// Clear all reservations
export const clearDb = () => {
    const db = initializeDb();
    db.reservations = [];
    db.pricelists = [];
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem('cosmosOdysseyDb', JSON.stringify(db));
    return true;
};

// Export database to JSON file
export const exportDb = () => {
    const db = initializeDb();
    
    // Create a simplified export with only essential reservation data
    const exportData = {
        reservations: db.reservations.map(reservation => ({
            id: reservation.id,
            passenger: reservation.passenger,
            route: reservation.route.map(segment => ({
                from: segment.from,
                to: segment.to,
                provider: segment.provider,
                price: segment.price,
                departure: segment.departure,
                arrival: segment.arrival
            })),
            totalPrice: reservation.totalPrice,
            totalTime: reservation.totalTime,
            totalDistance: reservation.totalDistance,
            createdAt: reservation.createdAt
        })),
        exportDate: new Date().toISOString(),
        version: db.version
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cosmos_odyssey_reservations_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}; 