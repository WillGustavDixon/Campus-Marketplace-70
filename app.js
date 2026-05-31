import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, collection, getDocs, getDoc, addDoc, deleteDoc, doc, query, where }
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
// ============================
// My Listings page - logic for mylistings.html
// ============================

const myListingsList = document.getElementById("myListingsList");

if (myListingsList) {
    // grab the elements we need from mylistings.html
    const signOutButton = document.getElementById("signOutButton");
    const userEmail = document.getElementById("userEmail");

    // check if the user is signed in
    onAuthStateChanged(auth, function (user) {
        if (user) {
            // user is signed in - show their email and load their listings
            userEmail.textContent = user.email;
            loadMyListings(user);
        } else {
            // not signed in - send them to login
            window.location.href = "login.html";
        }
    });

    // when sign out button is clicked, sign the user out
    signOutButton.addEventListener("click", function () {
        signOut(auth);
    });
}



// ============================
// Function: loadMyListings
// Loads items from Firestore where the seller is the current user
// ============================

async function loadMyListings(user) {
    // build a Firestore query: marketplaceItems where sellerId == this user's UID
    const myListingsQuery = query(
        collection(db, "marketplaceItems"),
        where("sellerId", "==", user.uid)
    );

    // run the query
    const itemsSnapshot = await getDocs(myListingsQuery);

    // clear the "Loading your listings..." placeholder
    myListingsList.innerHTML = "";

    // if the user hasn't listed anything, show a friendly message
    if (itemsSnapshot.empty) {
        myListingsList.innerHTML = "<p>You haven't listed any items yet.</p>";
        return;
    }

    // otherwise loop through each item and build a card for it
    itemsSnapshot.forEach(function (docSnapshot) {
        const item = docSnapshot.data();
        const itemImg = item.imageUrl;

        // format the createdTime into a readable date
        const itemDate = item.createdTime.toDate().toLocaleDateString("en-AU", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        // build a card element for this item
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
                        <p class="card-text">${item.isForTrade ? "For Trade" : "$" + item.price.toFixed(2)}</p>
                        <p class="card-text">${item.category}</p>
                        <p class="card-text">${item.description}</p>
                        <p class="card-text"><small>Listed ${itemDate}</small></p>
                    </div>
                </div>
            </div>
        `;

        myListingsList.appendChild(card);
    });
}



// ============================
// Shortlist page - logic for shortlist.html
// ============================

const shortlistList = document.getElementById("shortlistList");

if (shortlistList) {
    // grab the elements we need from shortlist.html
    const signOutButtonSL = document.getElementById("signOutButton");
    const userEmailSL = document.getElementById("userEmail");

    // check if the user is signed in
    onAuthStateChanged(auth, function (user) {
        if (user) {
            userEmailSL.textContent = user.email;
            loadShortlist(user);
        } else {
            window.location.href = "login.html";
        }
    });

    // sign out
    signOutButtonSL.addEventListener("click", function () {
        signOut(auth);
    });
}



// ============================
// Function: loadShortlist
// Loads the shortlist entries for the current user, then fetches each item's details
// ============================

async function loadShortlist(user) {
    // build a query: shortlist entries for this user
    const shortlistQuery = query(
        collection(db, "shortlist"),
        where("userId", "==", user.uid)
    );

    // run the query
    const shortlistSnapshot = await getDocs(shortlistQuery);

    // clear the loading placeholder
    shortlistList.innerHTML = "";

    // if shortlist is empty, show a friendly message
    if (shortlistSnapshot.empty) {
        shortlistList.innerHTML = "<p>You haven't shortlisted any items yet. Browse the marketplace to add some!</p>";
        return;
    }

    // for each shortlist entry, fetch the actual item details and build a card
    for (const shortlistDoc of shortlistSnapshot.docs) {
        const shortlistData = shortlistDoc.data();
        const itemId = shortlistData.itemId;
        const shortlistDocId = shortlistDoc.id;

        // look up the item document from marketplaceItems
        const itemRef = doc(db, "marketplaceItems", itemId);
        const itemSnap = await getDoc(itemRef);

        // skip if the item no longer exists (was deleted by the seller)
        if (!itemSnap.exists()) {
            continue;
        }

        const item = itemSnap.data();
        const itemImg = item.imageUrl;

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
                        <p class="card-text">${item.isForTrade ? "For Trade" : "$" + item.price.toFixed(2)}</p>
                        <p class="card-text">${item.category}</p>
                        <p class="card-text">${item.description}</p>
                        <p class="card-text"><small>Seller: ${item.sellerEmail}</small></p>
                        <button class="btn btn-danger remove-shortlist-btn" data-shortlist-id="${shortlistDocId}">Remove</button>
                    </div>
                </div>
            </div>
        `;

        shortlistList.appendChild(card);
    }

    // wire up all the Remove buttons
    const removeButtons = document.querySelectorAll(".remove-shortlist-btn");
    removeButtons.forEach(function (button) {
        button.addEventListener("click", async function () {
            const shortlistDocId = button.getAttribute("data-shortlist-id");

            // confirm before deleting
            const confirmed = confirm("Remove this item from your shortlist?");
            if (!confirmed) return;

            try {
                await deleteDoc(doc(db, "shortlist", shortlistDocId));
                // reload the shortlist to reflect the removal
                loadShortlist(user);
            } catch (error) {
                alert("Couldn't remove the item. Please try again.");
            }
        });
    });
}