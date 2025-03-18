const timeThingy = (1000 * 60 * 60); // conversion from milliseconds to hours

// helper function to calculate duration in hours between two dates
export function calculateDuration(flightStart, flightEnd) {
    // convert flightStart to a Date object
    const start = new Date(flightStart);
    
    // convert flightEnd to a Date object
    const end = new Date(flightEnd);
    
    // calculate the difference in time between the two dates in milliseconds
    const durationInMilliseconds = end - start;
    
    // convert the duration from milliseconds to hours using the conversion factor
    const durationInHours = durationInMilliseconds / timeThingy;
    
    // return the duration in hours
    return durationInHours;
}

// calculate total distance, time, and price for a route
export function calculateRouteDetails(route, selectedProviders) {
    // check if the inputs are valid arrays, if not, log a warning and return default values
    if (!route || !Array.isArray(route) || !selectedProviders || !Array.isArray(selectedProviders)) {
        console.warn('Invalid inputs to calculateRouteDetails:', { route, selectedProviders });
        return { distance: 0, time: 0, price: 0 };
    }

    // initialize variables to add total distance, time, and price
    let totalDistance = 0;
    let totalTime = 0;
    let totalPrice = 0;

    // iterate over each leg of the route
    route.forEach((leg, index) => {
        // check if the leg has valid route information, specifically distance
        if (!leg?.routeInfo?.distance) {
            return; // skip this leg if it's invalid
        }

        // get the corresponding provider for the current leg
        const provider = selectedProviders[index];
        if (!provider) return; // skip if no provider is found for this leg

        // add the distance of the current leg to the total distance
        totalDistance += leg.routeInfo.distance;
        try {
            // calculate the duration of the flight using the provider's start and end times
            const duration = calculateDuration(provider.flightStart, provider.flightEnd);
            // check if the calculated duration is a valid number
            if (!isNaN(duration)) {
                totalTime += duration; // add the duration to the total time
            }
            // add the price of the current leg to the total price, defaulting to 0 if undefined
            totalPrice += provider.price || 0;
        } catch (error) {
            // log a warning if there is an error in calculating times
        }
    });

    // return an object containing the total distance, time (rounded down to the nearest hour), and price
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

// check if a route is complete (no weird gaps)
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
        if (validProviders.length === 0) {
            return [];
        }

        // sort providers based on the filter
        const sortedProviders = validProviders.sort(function(a, b) {
            if (filter === 'fastest') {
                // if the filter is 'fastest', sort by duration
                return calculateDuration(a.flightStart, a.flightEnd) - calculateDuration(b.flightStart, b.flightEnd);
            } else {
                // otherwise, sort by price
                return a.price - b.price;
            }
        });

        return [sortedProviders[0]];
    }

    // multi routes
    // this i DO NOT UNDERSTAND!!
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

// find gaps in the route after provider removal (I had issues with it creating gaps)
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