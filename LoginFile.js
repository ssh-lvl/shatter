import 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://fffwukshwgrcdyqmvahg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnd1a3Nod2dyY2R5cW12YWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzOTkxMjAsImV4cCI6MjA0Njk3NTEyMH0.MsMeFMkrJCeJzRFWMZXM-CZu8gwaScV7feentsgMQvI';
const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
    { username: "ssh-lvl", password: "7ac1d30246b50aca1eb26f4095e77186cca72a86ee6c9f3e8e4f3fdbb20666aa", banned: false, banReason: "", premium: false, profilePicture: "UserImages/jusino.png", Admin: false}, //Admin
    { username: "jaxonb423", password: "c909cb3d8dd2e89d552237a86cc769be5d500c64738af56cef033693d3d3877f", banned: false, banReason: "", premium: true, profilePicture: "UserImages/jaxonb423.jpg", Admin: true} //Admin
]
// Login function
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const { data: user, error } = await supabase
        .from('users') // Assuming your table name is 'users'
        .select('username, password, banned, ban_reason, premium, profile_picture, admin') // Select required fields
        .eq('username', username)
        .single(); // Expect only one user with this username
    
    if (error || !user) {
        displayError("There is no account attached with this name, please create a login");
        return;
    }
    const encoder = new TextEncoder();
    const dataEncode = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataEncode);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    
    if (user.password !== hashHex) {
        displayError("Incorrect Password");
        return;
    }
    
    if (user.banned) {
        displayError(`This account has been banned. Reason: ${user.banReason}`);
        return;
    }
    
    clearError();
    
    // Save user data to localStorage
    localStorage.setItem('premium', user.premium);
    localStorage.setItem('loggedInUser', user.username);
    localStorage.setItem('profilePicture', user.profilePicture);
    localStorage.setItem('userVar', JSON.stringify(user));
    
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Return if the current user is an admin
function isUserAdmin() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userVar = localStorage.getItem('userVar');
    const user = JSON.parse(userVar);

    // Check if user exists and is an admin
    const isAdmin = user ? user.admin === true : false;
    console.log("isUserAdmin?: ", isAdmin);
    return isAdmin;
}


// Guest login function
function loginGuest() {
    localStorage.setItem('premium', 'false');
    localStorage.setItem('loggedInUser', 'Guest');
    
    setTimeout(() => {
        window.location.reload();
    }, 500);
}
// New logout function
function logoutChange() {
    localStorage.setItem('premium', 'loggedOut');
    localStorage.setItem('loggedInUser', 'loggedOut');
    localStorage.setItem('profilePicture', 'loggedOut');
    localStorage.setItem('userVar', 'loggedOut');
    localStorage.setItem('singleReload', '1');

    updateUIAfterLogout();
}
// Function to check and handle single reload
function checkSingleReload() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const singleReload = localStorage.getItem('singleReload');
    if (singleReload === '1' && loggedInUser !== 'loggedOut') {
        localStorage.setItem('singleReload', '0');
        window.location.reload();
    }
}
// Function to check user state
async function checkUserState() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userVar = localStorage.getItem('userVar');
    // If the user is logged out, prevent further checks and operations
    if (!loggedInUser || !userVar || loggedInUser === 'loggedOut' || userVar === 'loggedOut') {
        logoutChange();
        return;
    }
    const storedUser = JSON.parse(userVar);
    const { data: currentUser, error } = await supabase
        .from('users') // Assuming your users table is named 'users'
        .select('username, premium, profile_picture, admin') // Fetch only the necessary fields
        .eq('username', loggedInUser) // Match the logged-in username
        .single(); // Expecting only one result
    if (!currentUser) {
        logoutChange();
        return;
    }
    if (JSON.stringify(currentUser) !== JSON.stringify(storedUser)) {
        logoutChange();
        return;
    }
    // User state is valid, update UI
    updateUIAfterLogin(currentUser.username, currentUser.premium);
}
// Display error message
function displayError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}
// Clear error message
function clearError() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}
// Set up input navigation
function setupInputNavigation() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    usernameInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            passwordInput.focus();
        }
    });
    passwordInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            loginButton.click();
        }
    });
}

//this function is so dumb, user is a const, users is a const, the change would be client side...

// Ban user function
function banUser(username, reason) {
    const user = users.find(u => u.username === username);
    if (user) {
        user.banned = true;
        user.banReason = reason;
        console.log(`User ${username} has been banned. Reason: ${reason}`);
    } else {
        console.log(`User ${username} not found.`);
    }
}
// Update UI after login
function updateUIAfterLogin(username, isPremium) {
    document.getElementById('loginDiv').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    document.getElementById('name').textContent = username;
    const premiumStatusElement = document.getElementById('premiumStatus');
    if (isPremium) {
        premiumStatusElement.textContent = 'Premium Account';
        premiumStatusElement.classList.add('premium');
    } else {
        premiumStatusElement.textContent = 'Standard Account';
        premiumStatusElement.classList.add('non-premium');
    }
    
    const profilePicturePath = localStorage.getItem('profilePicture') || 'UserImages/Placeholder.png';
    const img = new Image();
    img.onload = function() {
        document.getElementById('profilePicture').src = profilePicturePath;
    };
    img.onerror = function() {
        document.getElementById('profilePicture').src = 'UserImages/Placeholder.png';
    };
    img.src = profilePicturePath;
}
// Update UI after logout
function updateUIAfterLogout() {
    document.getElementById('loginDiv').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('errorMessage').textContent = '';
}
// Show terms and conditions
function showTermsAndConditions() {
    const termsContainer = document.getElementById('termsContainer');
    if (termsContainer) {
        termsContainer.style.display = 'block';
    }
}
// Hide terms and conditions
function hideTermsAndConditions() {
    const termsContainer = document.getElementById('termsContainer');
    if (termsContainer) {
        termsContainer.style.display = 'none';
    }
}
// Main execution when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.title == "Shatter") {
    setupInputNavigation();
    checkSingleReload();
    checkUserState();
    const logoutButton = document.querySelector('.container button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutChange);
    }
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }
    const termsAccepted = localStorage.getItem('termsAccepted') === 'true';
    if (!termsAccepted) {
        showTermsAndConditions();
    }
    const acceptTermsButton = document.querySelector('#termsContainer button');
    if (acceptTermsButton) {
        acceptTermsButton.addEventListener('click', () => {
            localStorage.setItem('termsAccepted', 'true');
            hideTermsAndConditions();
        });
    }
}});
