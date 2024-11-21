let users

function getUser() {
    let usernameInput
    if (document.getElementById('username') != null) {
    usernameInput = document.getElementById('username').value; // Access the input's value
    }
    else {
    usernameInput = localStorage.getItem('loggedInUser')
    }
    return users.find(obj => obj.username === usernameInput) || ''; // Match username
}

// Login function
async function login() {
    if (users == null) {
        users = await fetchData('users');
    }
    const password = document.getElementById('password').value;
    const user = getUser();
    
    if (user == '' || user.enabled == false) {
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
    localStorage.setItem('premium', true);
    localStorage.setItem('loggedInUser', user.username);
    localStorage.setItem('profilePicture', user.profilePicturePath);
    localStorage.setItem('userVar', JSON.stringify(user));
    updateUIAfterLogin(user.username,user.premium)
    //setTimeout(() => {
    //    window.location.reload();
    //}, 500);
}

// Return if the current user is an admin
function isUserAdmin() {
    const user = getUser();

    // Check if user exists and is an admin
    const isAdmin = user ? user.Admin === true : false;
    console.log("isUserAdmin?: ", isAdmin);
    return isAdmin;
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
function checkUserState() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const userVar = localStorage.getItem('userVar');
    // If the user is logged out, prevent further checks and operations
    if (loggedInUser === 'loggedOut' || userVar === 'loggedOut') {
        return;
    }
    const storedUser = JSON.parse(userVar);
    const currentUser = getUser();
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
    
    const profilePicturePath = localStorage.getItem('profilePicture');
    const img = new Image();
    img.onload = function() {
        document.getElementById('profilePicture').src = profilePicturePath;
    };
    img.onerror = function() {
        document.getElementById('profilePicture').src = '';
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
document.addEventListener('DOMContentLoaded', async () => {
    if (users == null) {
        users = await fetchData('users');
    }
    if (document.title == "Shatter") {
    setupInputNavigation();
    checkSingleReload();
    checkUserState();
    const logoutButton = document.querySelector('.container button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutChange);
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
