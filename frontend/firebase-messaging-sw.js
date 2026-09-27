// =====================================================
// SMART CONSTRUCTION
// FIREBASE MESSAGING SERVICE WORKER
// =====================================================

importScripts(
    "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js"
);


// =====================================================
// FIREBASE CONFIG
// =====================================================

firebase.initializeApp({

    apiKey:
        "AIzaSyAZwwM86kQB2yzmaoY9jas_Oysll76tWFU",

    authDomain:
        "smart-construction-syste-cbba1.firebaseapp.com",

    projectId:
        "smart-construction-syste-cbba1",

    storageBucket:
        "smart-construction-syste-cbba1.firebasestorage.app",

    messagingSenderId:
        "194345157376",

    appId:
        "1:194345157376:web:b0fd95c6b0df651cf1e9e5",

    measurementId:
        "G-278TDYZ02M"

});


// =====================================================
// FIREBASE MESSAGING
// =====================================================

const messaging =
    firebase.messaging();


// =====================================================
// BACKGROUND NOTIFICATION
// =====================================================

messaging.onBackgroundMessage(
    function(payload) {

        console.log(
            "FCM background message:",
            payload
        );


        const title =
            payload.notification?.title ||
            "Smart Construction";


        const options = {

            body:
                payload.notification?.body ||
                "New Smart Construction notification.",

            icon:
                "/favicon.ico",

            badge:
                "/favicon.ico",

            tag:
                "smart-construction-login",

            data:
                payload.data || {}

        };


        self.registration.showNotification(
            title,
            options
        );

    }
);


// =====================================================
// NOTIFICATION CLICK
// =====================================================

self.addEventListener(
    "notificationclick",
    function(event) {

        event.notification.close();


        event.waitUntil(

            clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            }).then(function(clientList) {


                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        return client.focus();

                    }

                }


                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        "/dashboard.html"
                    );

                }

            })

        );

    }
);