// Service worker for browser notifications (registered by assets/push-web.js).
// Firebase shows notification messages itself and opens their fcmOptions.link on click.
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyCG-tMhJcXK3M6FpJDmBLbsAl56mxOc-X4",
  authDomain: "travelnow-a0cf3.firebaseapp.com",
  projectId: "travelnow-a0cf3",
  messagingSenderId: "530717343321",
  appId: "1:530717343321:web:282fd55bf13240ad733b48",
});
firebase.messaging();
