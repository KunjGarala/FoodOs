import { jwtDecode } from 'jwt-decode';

/**
 * Decodes the JWT token and returns the payload.
 * @param {string} token 
 * @returns {object|null}
 */
export const decodeToken = (token) => {
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error("Failed to decode token", error);
        return null;
    }
};

/**
 * Extracts the user role from the decoded token.
 * Handles different cases (string, array, object).
 * @param {object} decodedToken 
 * @returns {string} One of 'ADMIN', 'OWNER', 'MANAGER', 'USER'
 */
export const getUserRole = (decodedToken) => {
    if (!decodedToken) return 'USER';

    let role = decodedToken.role || decodedToken.authorities;

    if (Array.isArray(role)) {
        if (role.length > 0) {
            if (typeof role[0] === 'object' && role[0].authority) {
                return role[0].authority;
            }
            return role[0];
        }
        return 'USER';
    }
    
    return role || 'USER';
};

/**
 * Extracts accessible restaurant IDs from the decoded token.
 * @param {object} decodedToken 
 * @returns {string[]} Array of restaurant IDs
 */
export const getAccessibleRestaurants = (decodedToken) => {
    if (!decodedToken) return [];
    
    // Assuming backend sends 'restaurantIds' as an array in the token
    // or 'restaurantId' if it's a single value (Manager example)
    if (decodedToken.restaurantIds && Array.isArray(decodedToken.restaurantIds)) {
        return decodedToken.restaurantIds;
    }

    if (decodedToken.restaurantId) {
        return [decodedToken.restaurantId];
    }

    return [];
};

/**
 * Checks if the token is expired.
 * @param {object} decodedToken 
 * @returns {boolean}
 */
export const isTokenExpired = (decodedToken) => {
    if (!decodedToken || !decodedToken.exp) return true;
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
};
