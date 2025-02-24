const timeThingy = (1000 * 60 * 60); // ms to hours

// helper function to calculate duration in hours between two dates
export function calculateDuration(flightStart, flightEnd) {
    const start = new Date(flightStart);
    const end = new Date(flightEnd);
    return (end - start) / timeThingy;
}

// calculate total distance, time, and price for a route
export function calculateRouteDetails(route, selectedProviders) {
    if (!route || !Array.isArray(route) || !selectedProviders || !Array.isArray(selectedProviders)) {
        console.warn('Invalid inputs to calculateRouteDetails:', { route, selectedProviders });
        return { distance: 0, time: 0, price: 0 };
    }

    let totalDistance = 0;
    let totalTime = 0;
    let totalPrice = 0;

    route.forEach((leg, index) => {
        if (!leg?.routeInfo?.distance) {
            console.warn('Invalid leg:', leg);
            return;
        }

        const provider = selectedProviders[index];
        if (!provider) return;

        totalDistance += leg.routeInfo.distance;
        try {
            const duration = calculateDuration(provider.flightStart, provider.flightEnd);
            if (!isNaN(duration)) {
                totalTime += duration;
            }
            totalPrice += provider.price || 0;
        } catch (error) {
            console.warn('Error calculating times:', error);
        }
    });

    return {
        distance: totalDistance,
        time: Math.floor(totalTime),
        price: totalPrice
    };
}

// connecting flights for chronological order and waiting times
export function validateConnectingFlights(selectedProviders, allowPartial = false) {
    if (!selectedProviders || selectedProviders.length <= 1) return { valid: true };

    if (!allowPartial && selectedProviders.some(p => !p)) {
        return {
            valid: false,
            error: "Incomplete route selection"
        };
    }

    let firstProviderIndex = selectedProviders.findIndex(p => p !== null);
    let lastProviderIndex = selectedProviders.length - 1;
    while (lastProviderIndex >= 0 && !selectedProviders[lastProviderIndex]) {
        lastProviderIndex--;
    }

    for (let i = firstProviderIndex; i <= lastProviderIndex; i++) {
        if (!selectedProviders[i]) {
            return {
                valid: false,
                error: "Incomplete route: missing connection in the middle of route"
            };
        }
    }

    for (let i = firstProviderIndex; i < lastProviderIndex; i++) {
        const currentFlight = selectedProviders[i];
        const nextFlight = selectedProviders[i + 1];
        
        if (currentFlight && nextFlight) {
            const currentArrival = new Date(currentFlight.flightEnd);
            const nextDeparture = new Date(nextFlight.flightStart);
            
            if (nextDeparture <= currentArrival) {
                return {
                    valid: false,
                    error: `Invalid flight sequence: next flight starts before previous flight ends`
                };
            }

            const timeBetweenFlights = calculateDuration(currentFlight.flightEnd, nextFlight.flightStart);
            
            if (timeBetweenFlights < 1) {
                return {
                    valid: false,
                    error: `Not enough time between flights (${Math.round(timeBetweenFlights * 100) / 100} hours). Need at least 1 hour between flights.`
                };
            }
            
            if (timeBetweenFlights > 48) {
                return {
                    valid: false,
                    error: `Too much waiting time (${Math.floor(timeBetweenFlights)} hours). Maximum wait time is 48 hours.`
                };
            }
        }
    }
    
    return { valid: true };
}

// Check if a route is complete (no gaps)
export function isRouteComplete(providers) {
    if (!providers || providers.length === 0) return false;
    
    let firstProviderIndex = providers.findIndex(p => p !== null);
    let lastProviderIndex = providers.length - 1;
    while (lastProviderIndex >= 0 && !providers[lastProviderIndex]) {
        lastProviderIndex--;
    }

    for (let i = firstProviderIndex; i <= lastProviderIndex; i++) {
        if (!providers[i]) return false;
    }
    
    return true;
}

// best provider combination for a route based on filter
export function findBestProviderCombination(route, filter, selectedCompanies) {
    if (!route || !Array.isArray(route) || route.length === 0) {
        console.warn('Invalid route input to findBestProviderCombination:', route);
        return [];
    }

    // single routes
    if (route.length === 1) {
        const validProviders = route[0].providers.filter(provider => {
            const flightStart = new Date(provider.flightStart);
            const flightEnd = new Date(provider.flightEnd);
            return flightEnd > flightStart && selectedCompanies.has(provider.company.name);
        });

        if (validProviders.length === 0) return [];

        const sortedProviders = validProviders.sort((a, b) => {
            if (filter === 'fastest') {
                return calculateDuration(a.flightStart, a.flightEnd) - calculateDuration(b.flightStart, b.flightEnd);
            }
            return a.price - b.price;
        });

        return [sortedProviders[0]];
    }

    // multi routes
    let bestCombination = null;
    let bestMetric = Infinity;

    function isValidCombination(providers) {
        if (!providers || providers.some(p => !p)) return false;

        let lastEnd = new Date(providers[0].flightEnd);
        let firstStart = new Date(providers[0].flightStart);

        for (let i = 1; i < providers.length; i++) {
            const currentStart = new Date(providers[i].flightStart);
            const currentEnd = new Date(providers[i].flightEnd);

            if (currentStart < firstStart) return false;
            if (currentStart <= lastEnd) return false;

            const waitTime = calculateDuration(providers[i - 1].flightEnd, providers[i].flightStart);
            if (waitTime < 1 || waitTime > 48) return false;

            lastEnd = currentEnd;
        }
        return true;
    }

    function calculateMetric(providers) {
        if (!isValidCombination(providers)) return Infinity;

        if (filter === 'fastest') {
            return calculateDuration(providers[0].flightStart, providers[providers.length - 1].flightEnd);
        }
        return providers.reduce((sum, p) => sum + p.price, 0);
    }

    function findCombinations(legIndex = 0, currentProviders = [], lastFlightEnd = null, firstFlightStart = null) {
        if (legIndex === route.length) {
            const metric = calculateMetric(currentProviders);
            if (metric < bestMetric) {
                bestMetric = metric;
                bestCombination = [...currentProviders];
            }
            return;
        }

        for (const provider of route[legIndex].providers) {
            const flightStart = new Date(provider.flightStart);
            const flightEnd = new Date(provider.flightEnd);

            if (firstFlightStart && flightStart < firstFlightStart) continue;

            if (lastFlightEnd) {
                const waitTime = calculateDuration(lastFlightEnd, flightStart);
                if (waitTime < 1 || waitTime > 48 || flightStart <= lastFlightEnd) continue;
            }

            if (flightEnd > flightStart && selectedCompanies.has(provider.company.name)) {
                currentProviders.push(provider);
                findCombinations(
                    legIndex + 1, 
                    currentProviders, 
                    flightEnd,
                    firstFlightStart || flightStart
                );
                currentProviders.pop();
            }
        }
    }

    findCombinations();
    return bestCombination || [];
}

// Find gaps in the route after provider removal (I had issues with it creating gaps)
export function findRouteGap(route, providers) {
    let segments = [];
    let currentFrom = null;
    
    route.forEach((leg, index) => {
        if (providers[index]) {
            if (!currentFrom) {
                currentFrom = leg.routeInfo.from.name;
            }
            segments.push({
                from: leg.routeInfo.from.name,
                to: leg.routeInfo.to.name
            });
        } else if (currentFrom) {
            segments.push({
                gap: true,
                from: segments[segments.length - 1].to,
                to: leg.routeInfo.to.name
            });
        }
    });

    return segments;
}

// "ALL" possible routes between two planets
export function findAllRoutes(legs, fromPlanet, toPlanet) {
    const connections = {};
    legs.forEach(leg => {
        if (!connections[leg.routeInfo.from.name]) {
            connections[leg.routeInfo.from.name] = [];
        }
        connections[leg.routeInfo.from.name].push(leg);
    });

    function findAllPaths(start, end, visited = new Set(), path = []) {
        if (path.length >= 4) return [];
        if (start === end && path.length > 0) return [path];

        visited.add(start);
        const paths = [];
        const possibleLegs = connections[start] || [];
        
        possibleLegs.sort((a, b) => 
            a.routeInfo.to.name.localeCompare(b.routeInfo.to.name)
        );
        
        for (const leg of possibleLegs) {
            const nextPlanet = leg.routeInfo.to.name;
            if (!visited.has(nextPlanet)) {
                const newPath = [...path, leg];
                const newPaths = findAllPaths(nextPlanet, end, new Set(visited), newPath);
                
                for (const newPath of newPaths) {
                    const pathKey = newPath.map(l => `${l.routeInfo.from.name}-${l.routeInfo.to.name}`).join('|');
                    if (!paths.some(p => p.map(l => `${l.routeInfo.from.name}-${l.routeInfo.to.name}`).join('|') === pathKey)) {
                        paths.push(newPath);
                    }
                }
            }
        }

        return paths;
    }

    return findAllPaths(fromPlanet, toPlanet);
} 