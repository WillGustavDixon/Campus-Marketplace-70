import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAISRf5b_A8OSa1D7CKpDwyuVO-DfCXhKs",
  authDomain: "campus-marketplace-70.firebaseapp.com",
  projectId: "campus-marketplace-70",
  storageBucket: "campus-marketplace-70.firebasestorage.app",
  messagingSenderId: "999291011410",
  appId: "1:999291011410:web:c9778d239ee3509ca23a8b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const signInButton = document.getElementById("signInButton");
const messageArea = document.getElementById("messageArea");

signInButton.addEventListener("click", async function () {
    const email = emailInput.value;
    const password = passwordInput.value;
    // try to authenticate credentials with firebase; if error is thrown, show fail message
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Show welcome message
        messageArea.textContent = "Welcome, " + user.email + "! Redirecting...";
        messageArea.style.color = "green";

        // Redirect to welcome page after 1 seconds
        setTimeout(function () {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {
        messageArea.textContent = "Sign in failed. Please check your email and password.";
        messageArea.style.color = "red";
    }
});