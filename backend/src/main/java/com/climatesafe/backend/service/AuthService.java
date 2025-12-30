package com.climatesafe.backend.service;

import com.climatesafe.backend.model.User;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.FirestoreClient;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class AuthService {

    private static final String COLLECTION_NAME = "users";

    // Store Firestore profile using UID
    public String registerUser(User user) {
        try {
            if (user.getUid() == null || user.getUid().isEmpty()) {
                return "UID is required for registration";
            }
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME)
                    .document(user.getUid())
                    .set(user);
            return "User registered at: " + future.get().getUpdateTime();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return "Registration failed: " + e.getMessage();
        }
    }

    // Get user by UID
    public User getUserByUid(String uid) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(uid);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                return document.toObject(User.class);
            } else {
                return null;
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return null;
        }
    }

    // Verify Firebase ID token
    public FirebaseToken verifyIdToken(String idToken) throws FirebaseAuthException {
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }
}
