package com.climatesafe.backend.controller;

import com.climatesafe.backend.model.SignupRequest;
import com.climatesafe.backend.model.User;
import com.climatesafe.backend.service.AuthService;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.google.firebase.auth.FirebaseAuth;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ✅ Signup endpoint
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            // 1️⃣ Create user in Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getName());

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(createRequest);

            // 2️⃣ Create Firestore profile
            User user = new User();
            user.setUid(userRecord.getUid());
            user.setEmail(userRecord.getEmail());
            user.setDisplayName(userRecord.getDisplayName()); // <-- use UserRecord's displayName
            user.setRole("user");
            authService.registerUser(user);


            return ResponseEntity.ok(user);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signup failed: " + e.getMessage());
        }
    }

    // ✅ Get logged-in user's profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
        }
        String idToken = authorization.substring(7);
        try {
            var decodedToken = authService.verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            User user = authService.getUserByUid(uid);
            if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User profile not found");
            return ResponseEntity.ok(user);
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token: " + e.getMessage());
        }
    }
    // In AuthController.java
@PutMapping("/profile")
public ResponseEntity<?> updateProfile(
        @RequestHeader("Authorization") String authorization,
        @RequestBody User updatedUser) {
    try {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
        }
        String idToken = authorization.substring(7);
        var decodedToken = authService.verifyIdToken(idToken);
        String uid = decodedToken.getUid();

        // force uid match (prevent editing someone else’s profile)
        updatedUser.setUid(uid);

        authService.registerUser(updatedUser); // overwrite in Firestore
        return ResponseEntity.ok("Profile updated successfully!");

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating profile: " + e.getMessage());
    }
}


}
