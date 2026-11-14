
import { auth, db, ADMIN_EMAIL } from "./firebase.js";

import {
    initAdminDashboard,
    disposeAdminDashboard
} from "./admin.js";


import {
    GoogleAuthProvider,
    browserLocalPersistence,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// HTML elements
const loginView = document.getElementById("auth-screen");
const sessionView = document.getElementById("auth-session");
const adminPanel = document.getElementById("admin-panel");

const loginButton = document.getElementById("google-sign-in");
const logoutButton = document.getElementById("google-sign-out");

const loginMessage = document.getElementById("auth-message");

const roleTag = document.getElementById("auth-role-tag");
const sessionHeading = document.getElementById("auth-heading");
const sessionEmail = document.getElementById("auth-user-email");
const sessionMessage = document.getElementById("auth-session-message");

const portalHeader = document.querySelector("header.topbar");
const portalMain = document.querySelector("main");
const portalFooter = document.querySelector("footer.footer");

// Google provider
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});

let loginNotice =
    "Access is by invitation only. Use the Google account that was invited.";

let routingUid = null;


// Show login screen
function showLogin(message = loginNotice) {

    disposeAdminDashboard();

    loginView.hidden = false;
    sessionView.hidden = true;
    adminPanel.hidden = true;

    portalHeader.hidden = true;
    portalMain.hidden = true;
    portalFooter.hidden = true;

    loginMessage.textContent = message;
}



// Show authenticated account status
function showSession({ role, email, heading, message }) {

    disposeAdminDashboard();

    loginView.hidden = true;
    sessionView.hidden = false;
    adminPanel.hidden = true;

    portalHeader.hidden = true;
    portalMain.hidden = true;
    portalFooter.hidden = true;

    roleTag.textContent = role;
    sessionHeading.textContent = heading;
    sessionEmail.textContent = email;
    sessionMessage.textContent = message;
}



// Reject an account
async function denyAccess(message) {

    loginNotice = message;

    try {
        await signOut(auth);
    } finally {
        showLogin(loginNotice);
    }
}


// Check the account and its invitation
async function routeSignedInUser(user) {

    const email = (user.email || "")
        .trim()
        .toLowerCase();

    // Only accept verified Google email addresses.
    if (!user.emailVerified || !email) {

        await denyAccess(
            "Google did not provide a verified email address. Please try again with your invited Gmail account."
        );

        return;
    }

    // Make sure administrator setup is complete.
    if (!ADMIN_EMAIL || ADMIN_EMAIL.includes("YOUR_ADMIN_GMAIL")) {

        await denyAccess(
            "Setup is incomplete: add your administrator Gmail address in js/firebase.js first."
        );

        return;
    }

    // ADMIN LOGIN

// ADMIN LOGIN
    if (email === ADMIN_EMAIL) {

        loginView.hidden = true;
        sessionView.hidden = true;
        adminPanel.hidden = false;

        portalHeader.hidden = true;
        portalMain.hidden = true;
        portalFooter.hidden = true;

        try {

            await initAdminDashboard();

        } catch (error) {

            console.error(
                "Admin dashboard initialisation failed:",
                error
            );

            showLogin(
                "The administrator dashboard could not be opened. Please check your Firebase configuration and Firestore permissions."
            );

        }

        return;
    }



    // STUDENT LOGIN
    try {

        const invitationRef = doc(
            db,
            "invitations",
            email
        );

        const invitationSnapshot = await getDoc(invitationRef);

        // No invitation found.
        if (!invitationSnapshot.exists()) {

            await denyAccess(
                "This Google account has not been invited yet. Please contact your teacher and ask them to add this Gmail address."
            );

            return;
        }

        const invitation = invitationSnapshot.data();

        const invitedEmail = String(invitation.email || "")
            .trim()
            .toLowerCase();

        if (invitedEmail !== email) {

            await denyAccess(
                "The invitation details do not match this Google account. Please contact your teacher."
            );

            return;
        }

        // REVOKED ACCOUNT
        if (invitation.status === "revoked") {

            await denyAccess(
                "Access to this learning portal has been revoked. Please contact your teacher if you think this is a mistake."
            );

            return;
        }


        // PAUSED ACCOUNT
        if (invitation.status === "paused") {

            showSession({
                role: "STUDENT ACCOUNT · ACCESS PAUSED",
                email,

                heading: `Hello${invitation.name ? `, ${invitation.name}` : ""}.`,

                message:
                    "Your invitation is recognised, but lesson access is currently paused. Your renewal and payment area will be connected in the next implementation stage."
            });

            return;
        }


        // ACTIVE ACCOUNT
        if (invitation.status !== "active") {

            await denyAccess(
                "Your invitation is not active. Please contact your teacher."
            );

            return;
        }

        showSession({
            role: "STUDENT ACCOUNT · INVITATION ACTIVE",
            email,

            heading: `Welcome${invitation.name ? `, ${invitation.name}` : ""}.`,

            message:
                "Your invitation has been verified. Your personal lessons, monthly progress and learning history will be connected to this account in the next implementation stage."
        });

    } catch (error) {

        console.error("Invitation verification failed:", error);

        await denyAccess(
            "We could not verify your invitation. Check that Firestore rules are published and that your invitation document uses your Gmail address as its document ID."
        );
    }
}


// Google login button
loginButton.addEventListener("click", async () => {

    loginButton.disabled = true;

    loginMessage.textContent = "Connecting to Google…";

    try {

        await signInWithPopup(auth, googleProvider);

        // The authentication listener below handles the account.

    } catch (error) {

        console.error("Google sign-in failed:", error);

        const message =
            error.code === "auth/popup-closed-by-user"
                ? "The sign-in window was closed before the process finished. Please try again."
                : error.code === "auth/unauthorized-domain"
                    ? "This website domain is not authorised in Firebase Authentication. Add localhost or your website domain under Authentication settings."
                    : "We could not sign you in. Please try again, or check the Firebase configuration.";

        loginNotice = message;

        showLogin(message);

    } finally {

        loginButton.disabled = false;
    }
});


// Logout button
logoutButton.addEventListener("click", async () => {

    try {

        loginNotice =
            "You have signed out. Sign in again with your invited Google account.";

        await signOut(auth);

    } catch (error) {

        console.error("Sign-out failed:", error);

        sessionMessage.textContent =
            "We could not sign you out. Please refresh the page and try again.";
    }
});


// Start authentication and preserve sessions
async function startAuthentication() {

    try {

        await setPersistence(auth, browserLocalPersistence);

        onAuthStateChanged(auth, async user => {

            if (!user) {

                routingUid = null;

                showLogin(loginNotice);

                return;
            }

            if (routingUid === user.uid) return;

            routingUid = user.uid;

            await routeSignedInUser(user);
        });

    } catch (error) {

        console.error("Firebase initialisation failed:", error);

        showLogin(
            "Firebase could not start. Please check the values in js/firebase.js and reload the page."
        );
    }
}


// Initialise
showLogin();

startAuthentication();
