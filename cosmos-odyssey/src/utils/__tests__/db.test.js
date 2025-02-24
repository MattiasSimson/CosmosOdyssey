import { 
    initializeDb, 
    addPricelist, 
    getCurrentPricelist,
    addReservation,
    getAllReservations,
    deleteReservation
} from '../db';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('Database Operations', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('addPricelist should add a new pricelist and maintain only 15 pricelists', () => {
        // Create and add 16 pricelists
        for (let i = 0; i < 16; i++) {
            const pricelist = {
                id: `pricelist_${i}`,
                legs: [],
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            addPricelist(pricelist);
        }

        const db = JSON.parse(localStorage.getItem('cosmosOdysseyDb'));
        expect(db.pricelists.length).toBe(15);
        expect(db.pricelists[0].id).toBe('pricelist_15'); // Latest pricelist
    });

    test('addReservation should create a new reservation with required fields', () => {
        // First add a pricelist
        const pricelist = {
            id: 'test_pricelist',
            legs: [],
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        addPricelist(pricelist);

        // Create a reservation
        const reservation = {
            passenger: {
                firstName: 'John',
                lastName: 'Doe'
            },
            route: [{
                from: 'Earth',
                to: 'Mars',
                provider: 'SpaceX',
                price: 1000000,
                departure: '2024-03-20T10:00:00Z',
                arrival: '2024-03-21T10:00:00Z'
            }],
            totalPrice: 1000000,
            totalTime: 24,
            totalDistance: 225000000
        };

        const newReservation = addReservation(reservation);
        
        // Verify the reservation was added
        const allReservations = getAllReservations();
        expect(allReservations).toHaveLength(1);
        expect(allReservations[0].passenger.firstName).toBe('John');
        expect(allReservations[0].passenger.lastName).toBe('Doe');
        expect(allReservations[0].totalPrice).toBe(1000000);
    });

    test('deleteReservation should remove a reservation', () => {
        // Add a pricelist first
        const pricelist = {
            id: 'test_pricelist',
            legs: [],
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        addPricelist(pricelist);

        // Add a reservation
        const reservation = {
            passenger: {
                firstName: 'John',
                lastName: 'Doe'
            },
            route: [{
                from: 'Earth',
                to: 'Mars',
                provider: 'SpaceX',
                price: 1000000
            }],
            totalPrice: 1000000
        };

        const newReservation = addReservation(reservation);
        
        // Verify it was added
        expect(getAllReservations()).toHaveLength(1);
        
        // Delete the reservation
        deleteReservation(newReservation.id);
        
        // Verify it was deleted
        expect(getAllReservations()).toHaveLength(0);
    });

    test('reservations should be removed when their pricelist is pushed out of the last 15', () => {
        // Add a pricelist and make a reservation
        const oldPricelist = {
            id: 'old_pricelist',
            legs: [],
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        addPricelist(oldPricelist);

        const oldReservation = {
            passenger: {
                firstName: 'John',
                lastName: 'Doe'
            },
            route: [{
                from: 'Earth',
                to: 'Mars',
                provider: 'SpaceX',
                price: 1000000
            }],
            totalPrice: 1000000,
            pricelistId: 'old_pricelist'
        };
        addReservation(oldReservation);

        // Verify the reservation exists
        expect(getAllReservations()).toHaveLength(1);

        // Add 15 new pricelists to push out the old one
        for (let i = 0; i < 15; i++) {
            const newPricelist = {
                id: `new_pricelist_${i}`,
                legs: [],
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            addPricelist(newPricelist);
        }

        // Verify the old reservation is gone
        const remainingReservations = getAllReservations();
        expect(remainingReservations).toHaveLength(0);

        // Add a new reservation with the latest pricelist
        const newReservation = {
            passenger: {
                firstName: 'Jane',
                lastName: 'Smith'
            },
            route: [{
                from: 'Mars',
                to: 'Jupiter',
                provider: 'SpaceX',
                price: 2000000
            }],
            totalPrice: 2000000
        };
        addReservation(newReservation);

        // Verify only the new reservation exists
        const finalReservations = getAllReservations();
        expect(finalReservations).toHaveLength(1);
        expect(finalReservations[0].passenger.firstName).toBe('Jane');
    });
}); 