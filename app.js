import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, collection, getDocs, getDoc, setDoc, addDoc, deleteDoc, doc, query, where }
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
const signOutButton = document.getElementById("signOutButton");
const messageArea = document.getElementById("messageArea");
const userEmail = document.getElementById("userEmail");
var loggingIn = false; // set while fetching login validity from firebase.

const itemList = document.getElementById("itemList");
const myListingsList = document.getElementById("myListingsList");
const shortlistList = document.getElementById("shortlistList");

// login page logic
if (signInButton) 
    onAuthStateChanged(auth, function(user) { 
        if(user && !loggingIn) {  // if a user is logged in already, redirect to index.html
            window.location.href = "index.html";
        } 
        else { // otherwise add event listeners to detect login submissions.
            signInButton.addEventListener("click", validateLogin);
            emailInput.addEventListener("keydown", onEnter);
            passwordInput.addEventListener("keydown", onEnter);
        }
    }); 
else {
    onAuthStateChanged(auth, function (user) {
        if (user) {
            userEmail.textContent = user.email;
            if(itemList) {
                loadItems(user);
            }
            else if(myListingsList) {
                loadMyListings(user);
            }
            else if(shortlistList) {
                loadShortlist(user);
            }
        } else {
            window.location.href = "login.html";
        }
    });
    signOutButton.addEventListener("click", function () {
        signOut(auth);
    });
}

function onEnter() { if (event.key === "Enter") { validateLogin(); }}
async function validateLogin() {
    loggingIn = true;
    const email = emailInput.value;
    const password = passwordInput.value;
    messageArea.innerHTML = "&nbsp;..."; messageArea.style.color = "black";
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        messageArea.innerHTML = "&nbsp;Welcome, " + user.email + "! Redirecting...";
        messageArea.style.color = "green";

        setTimeout(function () { window.location.href = "index.html"; }, 1000);
        loggingIn = false;
    } catch (error) {
        messageArea.innerHTML =  "&nbsp;Sign in failed. Please check your email and password.";
        messageArea.style.color = "red";
    }
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
    const myMarketplaceQuery = query( 
        collection(db, "marketplaceItems"),
        where("sellerId", "!=", user.uid)  // firestore query to grab marketplace items (excl. owned by user)
    );
    const itemsSnapshot = await getDocs(myMarketplaceQuery);

    // gather existing user shortlist
    const shortListQuery = query(
        collection(db, "shortlist"),
        where("userId", "==", user.uid)
    );
    const shortListSnapshot = await getDocs(shortListQuery); // build a list of IDs to check shortListed 
    const shortlistIds = [];
    shortListSnapshot.forEach(function (docSnapshot) {
        shortlistIds.push(docSnapshot.data().itemId);
    });
    
    itemList.innerHTML = "";
    if (itemsSnapshot.empty) {
        itemList.innerHTML = "<p>No items available to trade or sale. Sorry!</p>";
        return;
    }
    itemsSnapshot.forEach(function (docSnapshot) {
        const item = docSnapshot.data();
        const itemId = docSnapshot.id;
        const itemImg = item.imageUrl;
        const shortlisted = shortlistIds.includes(itemId);

        //formatting Firestore date for Frontend
        const itemDate = item.createdTime.toDate().toLocaleDateString("en-AU", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        // build card for marketplace item
        const card = document.createElement("div");
        card.classList.add("itemCard");
        card.innerHTML = `
            <div class="cardImgWrap">

                <img src="${itemImg}"
                    onerror="this.onerror=null; this.src='images/blank.jpg';" 
                    class="img-fluid rounded-start" 
                alt="${item.name}">

            </div>

            <div class="cardBody">

                <h3 class="cardTitle">${item.name}</h3>

                <p class="cardPrice">${item.isForTrade? "Trade": "$"+item.price.toFixed(2)}</p>
                <p class="cardCategory">${item.category}</p>
                <p class="cardDesc">${item.description}</p>

                <p class="cardDate"><small>Listed ${itemDate}<br>Seller: ${item.sellerEmail}</small></p>

                <button class="cardShortlist" data-item-id="${itemId}" data-item-name="${item.name}" ${shortlisted ? 'disabled' : ''}>
                    ${shortlisted ? "Shortlisted" : "Shortlist"}
                </button>
            </div>
        `;
        itemList.appendChild(card);
    });

    //shortlist button functionality
    const shortlistBtns = document.querySelectorAll(".cardShortlist");
    shortlistBtns.forEach(function (button) {                                       
        button.addEventListener("click", async function () {                        
            const itemId = button.getAttribute("data-item-id");
            const itemName = button.getAttribute("data-item-name");
            const docID = itemId + "_" + user.uid;
            const newDoc =  doc(db, "shortlist", docID);
            try {
                await setDoc(newDoc, {
                    itemId: itemId,
                    itemName: itemName,
                    userId: user.uid
                });
                button.textContent = "Shortlisted";
                button.disabled = true;
            } catch (error) {
                console.log(error);
                alert("Something went wrong. Please try again.");
            }
        });
    });
}


// ============================
// My Listings page - logic for mylistings.html
// ============================

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
        const itemId = docSnapshot.id;
        const itemImg = item.imageUrl;
        const itemDate = item.createdTime.toDate().toLocaleDateString("en-AU", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        // build a card element for this item
        const card = document.createElement("div");
        card.classList.add("itemCard");
        card.innerHTML = `
            <div class="cardImgWrap">

                <img src="${itemImg}"
                    onerror="this.onerror=null; this.src='images/blank.jpg';" 
                    class="img-fluid rounded-start" 
                alt="${item.name}">

            </div>

            <div class="cardBody">

                <h3 class="cardTitle">${item.name}</h3>

                <p class="cardPrice">${item.isForTrade? "Trade": "$"+item.price.toFixed(2)}</p>
                <p class="cardCategory">${item.category}</p>
                <p class="cardDesc">${item.description}</p>

                <p class="cardDate"><small>Listed ${itemDate}</small></p>
            </div>
        `;

        myListingsList.appendChild(card);
    });
}


// ============================
// Shortlist page - logic for shortlist.html
// ============================

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
        const itemDate = item.createdTime.toDate().toLocaleDateString("en-AU", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        // build a card for this item
        const card = document.createElement("div");
        card.classList.add("itemCard");
        card.innerHTML = `
            <div class="cardImgWrap">

                <img src="${itemImg}"
                    onerror="this.onerror=null; this.src='images/blank.jpg';" 
                    class="img-fluid rounded-start" 
                alt="${item.name}">

            </div>

            <div class="cardBody">

                <h3 class="cardTitle">${item.name}</h3>

                <p class="cardPrice">${item.isForTrade? "Trade": "$"+item.price.toFixed(2)}</p>
                <p class="cardCategory">${item.category}</p>
                <p class="cardDesc">${item.description}</p>

                <p class="cardDate"><small>Listed ${itemDate}<br>Seller: ${item.sellerEmail}</small></p>

                <button class="cardShortlistRemove" data-shortlist-id="${shortlistDocId}">Remove</button>
            </div>
        `;

        shortlistList.appendChild(card);
    }

    // wire up all the Remove buttons
    const removeButtons = document.querySelectorAll(".cardShortlistRemove");
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