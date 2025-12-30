 package com.climatesafe.backend.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private Firestore db;

    // ✅ Fetch all reports from Firestore
    @GetMapping
    public List<Map<String, Object>> getReports() throws Exception {
        List<Map<String, Object>> reports = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = db.collection("reports").get();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            reports.add(doc.getData());
        }
        return reports;
    }

    // ✅ Add a new report
    @PostMapping
    public String addReport(@RequestBody Map<String, Object> report) throws Exception {
        db.collection("reports").add(report).get();
        return "Report added successfully!";
    }
}
