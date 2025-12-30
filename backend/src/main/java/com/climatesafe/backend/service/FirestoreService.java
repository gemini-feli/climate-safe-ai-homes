package com.climatesafe.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class FirestoreService {

    private static final String COLLECTION_NAME = "users";

    public String saveUser(String uid, String name, String email) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        Map<String, Object> userData = new HashMap<>();
        userData.put("uid", uid);
        userData.put("name", name);
        userData.put("email", email);

        ApiFuture<WriteResult> result = db.collection(COLLECTION_NAME).document(uid).set(userData);
        return "Saved at: " + result.get().getUpdateTime();
    }

    public Map<String, Object> getUser(String uid) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(uid);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            return document.getData();
        } else {
            throw new Exception("User not found");
        }
    }
}