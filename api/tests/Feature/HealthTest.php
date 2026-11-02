<?php

it('serves the API health endpoint', function () {
    $this->getJson('/api/health')->assertOk()->assertExactJson(['status' => 'ok']);
});

it('renders missing API endpoints as JSON', function () {
    $this->get('/api/missing')->assertNotFound()->assertJsonStructure(['message']);
});
