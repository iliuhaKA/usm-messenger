package com.usm.messenger.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.usm.messenger.service.PresenceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presence;

    /** GET /api/presence?ids=1,2,3 → {"1":"ONLINE","2":"OFFLINE",…} */
    @GetMapping
    public ResponseEntity<Map<Long, String>> getStatuses(@RequestParam("ids") List<Long> ids) {
        return ResponseEntity.ok(presence.getStatuses(ids));
    }
}
