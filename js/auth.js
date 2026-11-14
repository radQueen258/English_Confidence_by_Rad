
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


import {
    initStudentPortal,
    disposeStudentPortal
} from "./student-portal.js";


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

    disposeStudentPortal();

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


    // ======================================
    // VERIFY GOOGLE ACCOUNT
    // ======================================

    if (!user.emailVerified || !email) {

        await denyAccess(
            "Please sign in using a verified Google account."
        );

        return;
    }


    if (
        !ADMIN_EMAIL ||
        ADMIN_EMAIL.includes("YOUR_ADMIN_GMAIL")
    ) {

        await denyAccess(
            "Administrator configuration is incomplete."
        );

        return;
    }


    // ======================================
    // ADMINISTRATOR
    // ======================================

    if (email === ADMIN_EMAIL.toLowerCase()) {

        disposeStudentPortal();

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
                "Admin dashboard error:",
                error
            );

            showLogin(
                "The administrator dashboard could not be loaded."
            );

        }

        return;
    }


    // ======================================
    // STUDENT INVITATION
    // ======================================

    try {

        const invitationRef = doc(
            db,
            "invitations",
            email
        );

        const invitationSnapshot = await getDoc(
            invitationRef
        );


        if (!invitationSnapshot.exists()) {

            await denyAccess(
                "This Google account has not been invited. Please contact your teacher."
            );

            return;
        }


        const invitation = invitationSnapshot.data();

        const invitedEmail = String(
            invitation.email || ""
        ).trim().toLowerCase();


        if (invitedEmail !== email) {

            await denyAccess(
                "The invitation does not match this Google account."
            );

            return;
        }


        // ====================================
        // ACCESS STATUS
        // ====================================

        if (
            invitation.status !== "active" &&
            invitation.status !== "paused"
        ) {

            await denyAccess(
                "Your portal access is currently unavailable. Please contact your teacher."
            );

            return;
        }


        // ====================================
        // OPEN PERSONAL STUDENT PORTAL
        // ====================================

        await initStudentPortal(
            user,
            invitation
        );

        // IMPORTANT:
        // Stop here. Never show the old testing screen
        // after the student portal has loaded.
        return;


    } catch (error) {

        console.error(
            "Student authentication or portal error:",
            error
        );

        await denyAccess(
            "Your personal learning portal could not be loaded. Please check your connection or contact your teacher."
        );

        return;

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
