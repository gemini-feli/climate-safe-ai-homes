package com.climatesafe.backend.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

public class UploadCsvToFirestore {

    public static void main(String[] args) throws Exception {
        // 1️⃣ Initialize Firebase Admin SDK
        InputStream serviceAccount = new FileInputStream("src/main/resources/firebase-config.json");

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
        FirebaseApp.initializeApp(options);

        Firestore db = FirestoreClient.getFirestore();

        // 2️⃣ Delete existing documents in the collection
        ApiFuture<QuerySnapshot> future = db.collection("flood_dataset_labels").get();
        for (DocumentSnapshot doc : future.get().getDocuments()) {
            doc.getReference().delete();
        }
        System.out.println("🗑️ Existing documents deleted successfully!");

        // 3️⃣ Path to your CSV
        File csvFile = new File("src/main/resources/hello.csv");

        // 4️⃣ Parse CSV
        CSVParser parser = CSVParser.parse(csvFile, StandardCharsets.UTF_8,
                CSVFormat.DEFAULT.withFirstRecordAsHeader());

        // 5️⃣ Upload each record
        for (CSVRecord record : parser) {
            Map<String, Object> data = new HashMap<>();
            data.put("user_query", record.get("user_query"));
            data.put("location", record.get("location"));
            data.put("risk_summary", record.get("risk_summary"));
            data.put("image_findings", record.get("image_findings"));
            data.put("expected_response", record.get("expected_response"));

            // Convert priority from string/word to number
            String priorityStr = record.get("priority").toLowerCase().trim();
            int priority;
            switch (priorityStr) {
                case "high":
                    priority = 3;
                    break;
                case "medium":
                    priority = 2;
                    break;
                case "low":
                    priority = 1;
                    break;
                default:
                    try {
                        priority = Integer.parseInt(priorityStr);
                    } catch (NumberFormatException e) {
                        priority = 0; // fallback
                    }
            }
            data.put("priority", priority);

            ApiFuture<WriteResult> uploadFuture = db.collection("flood_dataset_labels").document().set(data);
            System.out.println("✅ Uploaded: " + record.get("user_query") + " -> " + uploadFuture.get().getUpdateTime());
        }

        parser.close();
        db.close(); // Close Firestore
        FirebaseApp.getInstance().delete(); // Shutdown Firebase

        System.out.println("🎯 CSV reload complete!");
        System.exit(0); // Force clean exit
    }
}
