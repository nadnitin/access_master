import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTIcxZErwDgoae6M4pjAP5g79tLPP9yCo",
  authDomain: "testuser-cb375.firebaseapp.com",
  projectId: "testuser-cb375",
  storageBucket: "testuser-cb375.firebasestorage.app",
  messagingSenderId: "195145012591",
  appId: "1:195145012591:web:d9a4f85178936ffe56849a",
  measurementId: "G-ZHT9SMV13W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let loggedInUser = null;

document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Username and password are required!");
        return;
    }

    document.getElementById("loader").style.display = "block";
    document.getElementById("submit").style.display = "none";

    try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Incorrect username or password.");
            return;
        }

        let foundUser = null;
        let userDocId = null;

        querySnapshot.forEach((docSnapshot) => {
            foundUser = docSnapshot.data();
            userDocId = docSnapshot.id;
        });

        const encodedPassword = btoa(password);
        if (foundUser.password !== encodedPassword) {
            alert("Incorrect username or password.");
            return;
        }

        if (foundUser.status.trim().toLowerCase() !== "active") {
            alert("Account inactive! Contact your ACC lead.");
            return;
        }

        let flagValue = parseInt(foundUser.flag, 10);
        
        // **Passing role to session storage**
        setSession(foundUser.username, foundUser.status, foundUser.role);

        if (flagValue === 1) {
            showPasswordResetPopup(userDocId, foundUser);
        } else {
            window.location.href = "master.html";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error connecting to the database.");
    } finally {
        document.getElementById("loader").style.display = "none";
        document.getElementById("submit").style.display = "block";
    }
});

function showPasswordResetPopup(userDocId, user) {
    loggedInUser = user;
    document.getElementById("resetPopup").style.display = "block";
    document.getElementById("resetBtn").onclick = async function () {
        let oldPassword = document.getElementById("oldPassword").value.trim();
        let newPassword = document.getElementById("newPassword").value.trim();
        let confirmPassword = document.getElementById("confirmPassword").value.trim();

        if (!oldPassword || !newPassword || !confirmPassword) {
            alert("All fields are required!");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match!");
            return;
        }

        let encodedOldPassword = btoa(oldPassword);
        if (loggedInUser.password !== encodedOldPassword) {
            alert("Incorrect old password!");
            return;
        }

        let encodedNewPassword = btoa(newPassword);
        try {
            const userDocRef = doc(db, "users", userDocId);
            await updateDoc(userDocRef, {
                password: encodedNewPassword,
                flag: 0
            });
            alert("Password updated successfully! Please login again.");
            closePasswordResetPopup();
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error updating password:", error);
            alert("Error updating password.");
        }
    };
}

window.closePasswordResetPopup = function() {
    document.getElementById("resetPopup").style.display = "none";
}

// **Session Management Functions**
function setSession(username, status, role) {
    localStorage.setItem("username", username);
    localStorage.setItem("name", "secrate");
    localStorage.setItem("role", role);  // **Now storing role in localStorage**
    localStorage.setItem("status", status);
    localStorage.setItem("lastActivity", Date.now()); // Store current time
}

// Refresh session on user activity
function refreshSession() {
    localStorage.setItem("lastActivity", Date.now());
}

// Check for session timeout every 1 minute
function checkSessionTimeout() {
    let lastActivity = localStorage.getItem("lastActivity");
    if (lastActivity) {
        let elapsedTime = Date.now() - lastActivity;
        if (elapsedTime > 15 * 60 * 1000) { // 15 minutes
            alert("Session expired! Please login again.");
            logoutUser();
        }
    }
}

// Logout Function
function logoutUser() {
    localStorage.removeItem("username");
    localStorage.removeItem("status");
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("role"); // **Remove role on logout**
    window.location.href = "index.html"; // Redirect to login page
}

// Event listeners to refresh session on activity
document.addEventListener("mousemove", refreshSession);
document.addEventListener("keypress", refreshSession);

// Check session timeout every 1 minute
setInterval(checkSessionTimeout, 60 * 1000);
