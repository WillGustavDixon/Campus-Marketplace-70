import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";


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
const db = getFirestore(app); 

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const signInButton = document.getElementById("signInButton");
const messageArea = document.getElementById("messageArea");

// login page logic
if (signInButton) {
    const email = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");
    const messageArea = document.getElementById("messageArea");

    signInButton.addEventListener("click", async function () {
        const email = emailInput.value;
        const password = passwordInput.value;
 
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            messageArea.textContent = "Welcome, " + user.email + "! Redirecting...";
            messageArea.style.color = "green";

            setTimeout(function () {
                window.location.href = "index.html";
            }, 2000);
        } catch (error) {
            messageArea.textContent = "Sign in failed. Please check your email and password.";
            messageArea.style.color = "red";
        }
    });
}

const itemList = document.getElementById("itemList");

if (itemList) {
    const signOutButton = document.getElementById("signOutButton");
    const userEmail = document.getElementById("userEmail");

    // onAuthStateChanged checks if someone is signed in
    onAuthStateChanged(auth, function (user) {
        if (user) {
            userEmail.textContent = user.email;
            loadItems(user);
        } else {
            // not signed in - send them to login
            window.location.href = "login.html";
        }
    });

    signOutButton.addEventListener("click", function () { signOut(auth);});
}


// This function loads items from Firestore and puts them on the page

/* ITEM METADATA IN FIRESTORE:  
    - category  (string)
    - createdTime (timestamp)
    - description (string)
    - imageUrl (string)
    - isForTrade (boolean)
    - name (string)
    - price (double)
    - sellerEmail (string)
    - sellerId (string)
*/

async function loadItems(user) {

    const itemsSnapshot = await getDocs(collection(db, "marketplaceItems"));

    itemList.innerHTML = "";

    itemsSnapshot.forEach(function (docSnapshot) {
        const item = docSnapshot.data();
        const itemId = docSnapshot.id;
        const itemImg = docSnapshot.data().imageUrl;
        const shortlisted = 0; // shortlistIds.includes(itemId);

        // turn the Firestore timestamp into a readable date
        const itemDate = item.createdTime.toDate().toLocaleDateString("en-AU", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        // build a card for this item
        const card = document.createElement("div");
        card.classList.add("card", "mb-3");
        card.innerHTML = `

            <div class="row g-0">

                <div class="col-md-4">

                    <img src="${itemImg}"
                        onerror="this.onerror=null; this.src='images/blank.jpg';" 
                        class="img-fluid rounded-start" 
                        alt="${item.name}">

                </div>

                <div class="col-md-8">

                    <div class="card-body">

                        <h5 class="card-title">${item.name}</h5>

                        <p class="card-text">$${item.price.toFixed(2)}</p>
                        <p class="card-text">${item.category}</p>
                        <p class="card-text">${item.description}</p>

                        <p class="card-text"><small>Listed ${itemDate}</small></p>
                        <p class="card-text"><small>Seller: ${item.sellerEmail}</small></p>

                        <button class="btn ${shortlisted ? 'btn-success' : 'btn-primary'} shortlist-btn" data-item-id="${itemId}" data-item-name="${item.name}" ${shortlisted ? 'disabled' : ''}>${shortlisted ? "Shortlisted" : "Shortlist"}</button>
                    </div>

                </div>

            </div>

        `;

        itemList.appendChild(card);
    });

    // make shortlist buttons work

    //const shortlistbtns = document.querySelectorAll(".shortlist-btn");
    
    /*
    shortlistbtns.forEach(function (button) {                                       

        button.addEventListener("click", async function () {                        
            const itemId = button.getAttribute("data-item-id");
            const itemName = button.getAttribute("data-item-name");
            try {
                await addDoc(collection(db, "shortlist"), {
                    userId: user.uid,
                    itemId: itemId,
                    addedAt: addedAt
                    // itemName: itemName 
                });
                button.textContent = "Shortlisted";
                button.classList.remove("btn-primary");
                button.classList.add("btn-success");
                button.disabled = true;
                loadShortlist(user);
            } catch (error) {
                alert("Something went wrong. Please try again.");
            }
        });
    });
    */
}
``