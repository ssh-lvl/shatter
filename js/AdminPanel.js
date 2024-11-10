
// Function to create and append the overlay
        function createOverlay() {
            const overlay = document.createElement('div');
            overlay.id = 'overlay';
            
            const iframe = document.createElement('iframe');
            iframe.src = 'index.html';
            iframe.style.cssText = 'width:100%;height:100%;border:none;';
            
            overlay.appendChild(iframe);
            document.body.appendChild(overlay);
        }

        // Function to remove the overlay
        function removeOverlay() {
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.remove();
            }
        }

        // Function to check if the current page is AdminPanel.html
        function isAdminPanel() {
            return window.location.pathname.endsWith('AdminPanel.html');
        }

        // Function to handle admin access
        function handleAdminAccess() {
            if (isAdminPanel()) {
                createOverlay(); // Always create the overlay for AdminPanel.html
                if (isUserAdmin()) {
                    // Allow access to admin panel
                    console.log('Allowing access to AdminPanel.html');
                    removeOverlay();
                } else {
                    // Redirect to login page or show access denied message
                    console.log('Access denied. Redirecting to login page...');
                    window.location.href = 'WompWomp.html'; // Replace with your actual login page URL
                }
            }
        }

        // Call the function when the page loads
        document.addEventListener('DOMContentLoaded', handleAdminAccess);

        // Call the function whenever localStorage changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'loggedInUser') {
                console.log('Local storage changed:', event.key);
                handleAdminAccess();
            }
        });